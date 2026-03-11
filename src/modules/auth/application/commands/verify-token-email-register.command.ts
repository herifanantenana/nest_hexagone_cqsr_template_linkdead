import { authConfig } from "@apk_core/config";
import { type TAuthConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { InvalidRegistrationTokenException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { RegistrationsRepoAuthPort } from "../ports/registrations-repo-auth.port";

export class VerifyTokenEmailRegisterCommand {
	constructor(public readonly tokenEncrypted: string) {}
}

export interface IVerifyTokenEmailRegisterCommandResult {
	statusCode: number;
	message: string;
}

@CommandHandler(VerifyTokenEmailRegisterCommand)
export class VerifyTokenEmailRegisterCommandHandler implements ICommandHandler<
	VerifyTokenEmailRegisterCommand,
	IVerifyTokenEmailRegisterCommandResult
> {
	constructor(
		private readonly logger: AppLogger,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(authConfig.KEY) private readonly authCfg: TAuthConfig,
		private readonly registerCooldownPort: RegisterCooldownPort,
		private readonly registrationsRepoAuthPort: RegistrationsRepoAuthPort,
	) {
		this.logger = this.logger.withContext(VerifyTokenEmailRegisterCommandHandler.name);
	}

	async execute(command: VerifyTokenEmailRegisterCommand): Promise<IVerifyTokenEmailRegisterCommandResult> {
		const { tokenEncrypted } = command;

		// decrypt the token and get the email
		const decrypted = this.encryptionDecryptionPort.decryptFromSecret<{ email: string; token: string }>(
			tokenEncrypted,
			this.authCfg.registerTokenSecret,
		);
		if (!decrypted) throw new InvalidRegistrationTokenException();

		// check if the token is valid and not cooled down
		const isOnCooldown = await this.registerCooldownPort.isOnEmailCooldown(decrypted.email);
		if (!isOnCooldown) throw new InvalidRegistrationTokenException();

		// check if the token matches the one on cooldown
		const tokenOnCooldown = await this.registerCooldownPort.getCooldownToken(decrypted.email);
		if (tokenOnCooldown !== tokenEncrypted) throw new InvalidRegistrationTokenException();

		// check if token expiration still under the session
		const registration = await this.registrationsRepoAuthPort.findByEmail(decrypted.email);
		if (!registration) throw new InvalidRegistrationTokenException();

		// check if the token hash matches the one in database
		const tokenHash = this.encryptionDecryptionPort.hashFromSecret(decrypted.token, this.authCfg.registerTokenSecret);
		if (registration.tokenHash !== tokenHash) throw new InvalidRegistrationTokenException();

		// check if toke expiration still under the session
		if (registration.expiresAt.getTime() <= Date.now()) throw new InvalidRegistrationTokenException();

		return {
			statusCode: 200,
			message: "Registration token confirmed successfully",
		};
	}
}
