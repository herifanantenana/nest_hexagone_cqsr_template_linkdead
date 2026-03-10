import { authConfig } from "@apk_core/config";
import { type TAuthConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { InvalidRegistrationTokenException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";

export class ConfirmTokenRegisterCommand {
	constructor(public readonly tokenEncrypted: string) {}
}

export interface IConfirmTokenRegisterCommandResult {
	statuscode: number;
	message: string;
}

@CommandHandler(ConfirmTokenRegisterCommand)
export class ConfirmTokenRegisterHandler implements ICommandHandler<
	ConfirmTokenRegisterCommand,
	IConfirmTokenRegisterCommandResult
> {
	constructor(
		private readonly logger: AppLogger,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(authConfig.KEY) private readonly authCfg: TAuthConfig,
		private readonly registerCooldownPort: RegisterCooldownPort,
	) {
		this.logger = this.logger.withContext(ConfirmTokenRegisterHandler.name);
	}

	async execute(command: ConfirmTokenRegisterCommand): Promise<IConfirmTokenRegisterCommandResult> {
		const { tokenEncrypted } = command;

		// decrypt the token and get the email
		const decrypted = this.encryptionDecryptionPort.decryptFromSecret<{ email: string; token: string }>(
			tokenEncrypted,
			this.authCfg.registerTokenSecret,
		);
		this.logger.debug(`Decrypted token email: ${decrypted?.email} , token ${decrypted?.token}`);
		if (!decrypted) throw new InvalidRegistrationTokenException();

		// check if the token is valid and not cooled down
		const isOnCooldown = await this.registerCooldownPort.isOnEmailCooldown(decrypted.email);
		if (!isOnCooldown) throw new InvalidRegistrationTokenException();

		// check if the token matches the one on cooldown
		const tokenOnCooldown = await this.registerCooldownPort.getCooldownToken(decrypted.email);
		if (tokenOnCooldown !== tokenEncrypted) throw new InvalidRegistrationTokenException();

		return {
			statuscode: 200,
			message: "Registration token confirmed successfully",
		};
	}
}
