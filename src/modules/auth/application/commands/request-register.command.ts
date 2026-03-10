import { authConfig } from "@apk_core/config";
import { type TAuthConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { EmailAlreadyInUseRegisterException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { AuthValidatorService } from "@apk_modules/auth/domain/services/auth-validator.service";
import { type IUnitOfWorkPort, UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BoxMailerPort } from "../ports/box-mailer.port";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { RegistrationsRepoAuthPort } from "../ports/registrations-repo-auth.port";
import { UsersRepoAuthPort } from "../ports/users-repo-auth.port";

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
	private readonly authValidator = new AuthValidatorService();

	constructor(
		private readonly logger: AppLogger,
		private readonly usersRepoPort: UsersRepoAuthPort,
		private readonly registerCooldownPort: RegisterCooldownPort,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(authConfig.KEY) private readonly authConfig: TAuthConfig,
		private readonly registrationsRepoAuthPort: RegistrationsRepoAuthPort,
		@Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWorkPort,
		private readonly boxMailerPort: BoxMailerPort,
	) {
		this.logger = this.logger.withContext(RequestRegisterCommandHandler.name);
	}

	async execute(command: RequestRegisterCommand): Promise<IRequestRegisterCommandResult> {
		const { email } = command;

		// validate email format
		this.authValidator.validateEmail(email);

		// check email uniqueness
		if (await this.usersRepoPort.findIdByEmail(email)) throw new EmailAlreadyInUseRegisterException(email);

		// check redis cooldown
		if (await this.registerCooldownPort.isOnEmailCooldown(email)) {
			this.logger.warn("Registration attempt is on cooldown");
			return { statusCode: 200, message: "Please check your inbox." };
		}

		// generate token
		const token = this.encryptionDecryptionPort.generateRandomToken(32);
		const tokenHash = this.encryptionDecryptionPort.hashFromSecret(token, this.authConfig.registerTokenSecret);
		const tokenEncrypted = this.encryptionDecryptionPort.encryptFromSecret(
			{ email, token },
			this.authConfig.registerTokenSecret,
		);
		const expiresAt = new Date(Date.now() + this.authConfig.registration.tokenTtlSec * 1000);

		const registration = await this.registrationsRepoAuthPort.findByEmail(email);

		// if no registration, create new one and send email
		if (!registration) {
			return this.unitOfWork.withTransaction(async (tx) => {
				await this.registrationsRepoAuthPort.create({ email, tokenHash, expiresAt }, tx);
				await this.registerCooldownPort.start(email, tokenEncrypted, this.authConfig.registration.tokenCooldown.ttlSec);
				await this.boxMailerPort.sendVerificationRegisterEmail(email, tokenEncrypted);
				return { statusCode: 201, message: "Request Registration link sent. Please check your inbox." };
			});
		}

		const { expiresAt: registrationExpiresAt, sentCount } = registration;

		// if registration expired, reset token and send email
		if (registrationExpiresAt.getTime() <= Date.now()) {
			return this.unitOfWork.withTransaction(async (tx) => {
				await this.registrationsRepoAuthPort.resetByEmail({ email, tokenHash, expiresAt }, tx);
				await this.registerCooldownPort.start(email, tokenEncrypted, this.authConfig.registration.tokenCooldown.ttlSec);
				await this.boxMailerPort.sendVerificationRegisterEmail(email, tokenEncrypted);
				return { statusCode: 200, message: "Registration token reset. Please check your inbox." };
			});
		}

		// if sent count exceeds max attempts, return too many requests
		if (sentCount >= this.authConfig.registration.tokenCooldown.maxAttempts) {
			this.logger.warn("Maximum registration attempts exceeded");
			return { statusCode: 429, message: "Maximum registration attempts exceeded. Please try again later." };
		}

		// if registration valid and cooldown expired, rotate token and send email
		return await this.unitOfWork.withTransaction(async (tx) => {
			await this.registrationsRepoAuthPort.rotateByEmail({ email, tokenHash }, tx);
			await this.registerCooldownPort.start(email, tokenEncrypted, this.authConfig.registration.tokenCooldown.ttlSec);
			await this.boxMailerPort.sendVerificationRegisterEmail(email, tokenEncrypted);
			return { statusCode: 200, message: "Registration token rotated. Please check your inbox." };
		});
	}
}
