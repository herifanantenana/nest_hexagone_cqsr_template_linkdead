import { authConfig } from "@apk_core/config";
import { type TAuthConfig } from "@apk_core/config/root.config";
import { InvalidRegistrationTokenException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { Inject, Injectable } from "@nestjs/common";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { IRegistrationsFindOutput, RegistrationsRepoAuthPort } from "../ports/registrations-repo-auth.port";

export interface IValidatedRegistration {
	decrypted: { email: string; token: string };
	registration: IRegistrationsFindOutput;
}

@Injectable()
export class RegisterTokenValidatorService {
	constructor(
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(authConfig.KEY) private readonly authCfg: TAuthConfig,
		private readonly registerCooldownPort: RegisterCooldownPort,
		private readonly registrationsRepoAuthPort: RegistrationsRepoAuthPort,
	) {}

	async validate(tokenEncrypted: string): Promise<IValidatedRegistration> {
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

		// check if registration exists in database
		const registration = await this.registrationsRepoAuthPort.findByEmail(decrypted.email);
		if (!registration) throw new InvalidRegistrationTokenException();

		// check if the token hash matches the one in database
		const tokenHash = this.encryptionDecryptionPort.hashFromSecret(decrypted.token, this.authCfg.registerTokenSecret);
		if (registration.tokenHash !== tokenHash) throw new InvalidRegistrationTokenException();

		// check if token expiration is still valid
		if (registration.expiresAt.getTime() <= Date.now()) throw new InvalidRegistrationTokenException();

		return { decrypted, registration };
	}
}
