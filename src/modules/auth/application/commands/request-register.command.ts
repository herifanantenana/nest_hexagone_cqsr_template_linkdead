import authEnvConfig from "@apk_common/config/auth-env.config";
import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { EmailAlreadyInUseRegisterException } from "@apk_modules/auth/domain/errors/auth-business.error";
import { AuthValidatorService } from "@apk_modules/auth/domain/services/auth-validator.service";
import { Inject } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { randomBytes } from "crypto";
import { HasherBrutPort } from "../ports/hasher-brut.port";
import { RedisAuthPort } from "../ports/redis-auth.port";
import { RegistrationsAuthPort } from "../ports/registration-auth.port";
import { UsersAuthPort } from "../ports/users-auth.port";

export class RequestRegisterCommand {
	constructor(public readonly email: string) {}
}

export interface IRequestRegisterCommandResult {
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
		private readonly redisAuthPort: RedisAuthPort,
		private readonly registrationsAuthPort: RegistrationsAuthPort,
		private readonly hasherBrutPort: HasherBrutPort,
	) {
		this.logger = appLogger.withContext(RequestRegisterCommandHandler.name);
	}

	// execute command
	async execute(command: RequestRegisterCommand): Promise<IRequestRegisterCommandResult> {
		const { email } = command;
		this.logger.log(`Handling RequestRegisterCommand: email: ${email}`);

		// validate business
		this.authValidator.validateEmail(email);

		// check email uniqueness
		if (await this.usersAuthPort.findIdByEmail(email)) throw new EmailAlreadyInUseRegisterException(email);

		// check cooldown in Redis
		if (await this.redisAuthPort.getTokenCoolDownRegister(email)) {
			this.logger.warn(`Cooldown active for email ${email}. Cannot request new registration token.`);
			return {
				message: "Please check your inbox or try again later.",
			};
		}

		const token = randomBytes(32).toString("hex");
		const hashedToken = await this.hasherBrutPort.hashCrypto(token, this.authConfig.registrationTokenSecret);
		const expiresAt = new Date(Date.now() + this.authConfig.registrationTokenDbTtlSec * 1000); // 1h

		const registration = await this.registrationsAuthPort.findHashedTokenExpireAtByEmail(email);
		// email not registered yet
		if (!registration) {
			await this.registrationsAuthPort.createRegistration({ email, hashedToken, expiresAt });
			this.logger.debug(`Registration token created for email: ${email}`);
			// todo: send email with newToken
			return {
				message: "Registration token created. Please check your inbox.",
			};
		}

		const { expiresAt: registrationExpiresAt, lastSentAt, sentCount } = registration;
		// token expired
		if (registrationExpiresAt.getTime() <= Date.now()) {
			await this.registrationsAuthPort.resetRegistrationByEmail({ email, hashedToken, expiresAt });
			this.logger.debug(`Existing registration token expired for email: ${email}. Resetting registration.`);

			await this.redisAuthPort.setTokenCoolDownRegister(email, token, this.authConfig.registrationCooldownSec);
			this.logger.debug(`Cooldown set in Redis for email: ${email}`);
			return {
				message: "Registration token expired and overwritten. Please check your inbox.",
			};
		}

		// countSent too many or last sent less than half of cooldown time ago
		if (
			sentCount >= this.authConfig.registrationMaxAttempts ||
			lastSentAt.getTime() + (this.authConfig.registrationCooldownSec / 2) * 1000 > Date.now()
		) {
			this.logger.warn(`Too many registration requests for email: ${email}`);
			return {
				message: "Too many registration requests. Please try again later.",
			};
		}

		// update registration token and sent count
		await this.registrationsAuthPort.updateCounterRegistrationByEmail(
			{
				email,
				hashedToken,
			},
			undefined,
		);
		this.logger.debug(`Registration token updated for email: ${email}`);

		// register cooldown in Redis
		await this.redisAuthPort.setTokenCoolDownRegister(email, token, this.authConfig.registrationCooldownSec);
		this.logger.debug(`Cooldown set in Redis for email: ${email}`);

		// todo: send email with newToken
		return {
			message: "Registration token updated. Please check your inbox.",
		};
	}
}
