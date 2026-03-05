import authEnvConfig from "@apk_common/config/auth-env.config";
import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { MailerService } from "@apk_common/infra/mailer/mailer.service";
import { EmailAlreadyInUseRegisterException } from "@apk_modules/auth/domain/errors/auth-business.error";
import { AuthValidatorService } from "@apk_modules/auth/domain/services/auth-validator.service";
import { Inject } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { RegistrationsAuthPort } from "../ports/registration-auth.port";
import { TokenHasherPort } from "../ports/token-hasher.port";
import { UsersAuthPort } from "../ports/users-auth.port";

export class RequestRegisterCommand {
	constructor(public readonly email: string) {}
}

export interface IRequestRegisterCommandResult {
	statusCode: number;
	message: string;
}

@CommandHandler(RequestRegisterCommand)
export class RequestRegisterCommandHandler implements ICommandHandler<
	RequestRegisterCommand,
	IRequestRegisterCommandResult
> {
	private readonly logger: AppLogger;
	private readonly authValidator = new AuthValidatorService();

	constructor(
		private readonly appLogger: AppLogger,
		@Inject(authEnvConfig.KEY) private readonly authConfig: ConfigType<typeof authEnvConfig>,
		private readonly usersAuthPort: UsersAuthPort,
		private readonly registerCooldownPort: RegisterCooldownPort,
		private readonly registrationsAuthPort: RegistrationsAuthPort,
		private readonly tokenHasherPort: TokenHasherPort,
		// ! not safe
		private readonly mailerService: MailerService,
	) {
		this.logger = appLogger.withContext(RequestRegisterCommandHandler.name);
	}

	// execute command
	async execute(command: RequestRegisterCommand): Promise<IRequestRegisterCommandResult> {
		const { email } = command;
		this.logger.debug(`Handling RequestRegisterCommand: email: ${email}`);

		// validate business
		this.authValidator.validateEmail(email);

		// check email uniqueness
		if (await this.usersAuthPort.findIdByEmail(email)) throw new EmailAlreadyInUseRegisterException(email);

		// check cooldown in Redis
		if (await this.registerCooldownPort.isOnCooldown(email)) {
			this.logger.warn(`Cooldown active for email ${email}. Cannot request new registration token.`);
			return {
				statusCode: 200,
				message: "Please check your inbox or try again later.",
			};
		}

		// generate registration token and hash
		const token = this.tokenHasherPort.generateRandomToken(32);
		const tokenHash = await this.tokenHasherPort.hashFromSecret(token, this.authConfig.registrationTokenSecret);
		const expiresAt = new Date(Date.now() + this.authConfig.registrationTokenTtlSec * 1000);

		const registration = await this.registrationsAuthPort.findByEmail(email);
		// email not registered yet
		if (!registration) {
			// create registration
			await this.registrationsAuthPort.create({ email, tokenHash, expiresAt });
			// register cooldown in Redis
			await this.registerCooldownPort.start(email, token, this.authConfig.registrationCooldownSec);
			// todo: send email with newToken
			const verifyUrl = `${this.authConfig.frontendBaseUrl}?token=${token}&email=${encodeURIComponent(email)}`;
			await this.mailerService.sendVerificationEmail(email, email.split("@")[0], verifyUrl);
			return {
				statusCode: 201,
				message: "Registration token created. Please check your inbox.",
			};
		}

		const { expiresAt: registrationExpiresAt, sentCount } = registration;
		// token expired
		if (registrationExpiresAt.getTime() <= Date.now()) {
			this.logger.debug("Resetting expired registration token for email: " + email);
			// reset registration token and sent count
			await this.registrationsAuthPort.resetByEmail({ email, tokenHash, expiresAt });
			// start a new cooldown in Redis
			await this.registerCooldownPort.start(email, token, this.authConfig.registrationCooldownSec);
			// todo: send email with newToken
			const verifyUrl = `${this.authConfig.frontendBaseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
			await this.mailerService.sendVerificationEmail(email, email.split("@")[0], verifyUrl);
			return {
				statusCode: 200,
				message: "Registration token expired and overwritten. Please check your inbox.",
			};
		}

		// countSent too many or last sent less than half of cooldown time ago
		if (
			sentCount >= this.authConfig.registrationMaxAttempts
			// lastSentAt.getTime() + (this.authConfig.registrationCooldownSec / 2) * 1000 > Date.now()
		) {
			this.logger.warn(`Too many registration requests for email: ${email}`);

			return {
				statusCode: 429,
				message: "Too many registration requests. Please try again later.",
			};
		}

		// update registration token and sent count
		await this.registrationsAuthPort.rotateByEmail({ email, tokenHash });

		// register cooldown in Redis
		await this.registerCooldownPort.start(email, token, this.authConfig.registrationCooldownSec);
		// todo: send email with newToken
		const verifyUrl = `${this.authConfig.frontendBaseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
		await this.mailerService.sendVerificationEmail(email, email.split("@")[0], verifyUrl);
		return {
			statusCode: 200,
			message: "Registration token updated. Please check your inbox.",
		};
	}
}
