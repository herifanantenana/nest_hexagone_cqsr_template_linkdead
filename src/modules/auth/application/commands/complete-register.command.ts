import { authConfig, jwtConfig, type TAuthConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { InvalidRegistrationTokenException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { type IUnitOfWorkPort, UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AuthValidatorService } from "../../domain/services/auth-validator.service";
import { AccountsRepoAuthPort } from "../ports/accounts-repo-auth.port";
import { ActorsRepoAuthPort } from "../ports/actors-repo-auth.port";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { PasswordHasherPort } from "../ports/password-hasher.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { RegistrationsRepoAuthPort } from "../ports/registrations-repo-auth.port";
import { SessionsRepoAuthPort } from "../ports/sessions-repo-auth.port";
import { TokenizerPort } from "../ports/tokenizer.port";
import { UsersRepoAuthPort } from "../ports/users-repo-auth.port";

export class CompleteRegisterCommand {
	constructor(
		public readonly tokenEncrypted: string,
		public readonly firstName: string,
		public readonly lastName: string,
		public readonly password: string,
		public readonly userAgent: string,
		public readonly ipAddress: string,
	) {}
}

export interface ICompleteRegisterCommandResult {
	userId: string;
	accountId: string;
	actorId: string;
	sessionId: string;
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

@CommandHandler(CompleteRegisterCommand)
export class CompleteRegisterCommandHandler implements ICommandHandler<
	CompleteRegisterCommand,
	ICompleteRegisterCommandResult
> {
	private readonly authValidatorService = new AuthValidatorService();

	constructor(
		private readonly logger: AppLogger,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(authConfig.KEY) private readonly authCfg: TAuthConfig,
		private readonly registerCooldownPort: RegisterCooldownPort,
		private readonly registrationsRepoAuthPort: RegistrationsRepoAuthPort,
		private readonly passwordHasherPort: PasswordHasherPort,
		@Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWorkPort,
		private readonly usersRepoAuthPort: UsersRepoAuthPort,
		private readonly accountsRepoAuthPort: AccountsRepoAuthPort,
		private readonly actorsRepoAuthPort: ActorsRepoAuthPort,
		private readonly tokenizerPort: TokenizerPort,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
		private readonly sessionsRepoAuthPort: SessionsRepoAuthPort,
	) {
		this.logger = this.logger.withContext(CompleteRegisterCommandHandler.name);
	}

	async execute(command: CompleteRegisterCommand): Promise<ICompleteRegisterCommandResult> {
		const { tokenEncrypted, firstName, lastName, password, userAgent, ipAddress } = command;

		this.logger.debug(`Processing registration completion command for: ${JSON.stringify(command)}`);

		// validate the input
		this.authValidatorService.validateName(firstName);
		this.authValidatorService.validateName(lastName);
		this.authValidatorService.validatePassword(password);

		/// decrypt the token and get the email
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

		// check if token is valid on database
		const tokenHash = this.encryptionDecryptionPort.hashFromSecret(decrypted.token, this.authCfg.registerTokenSecret);
		const registration = await this.registrationsRepoAuthPort.findByEmail(decrypted.email);
		if (!registration || registration.tokenHash !== tokenHash) throw new InvalidRegistrationTokenException();

		// hash password
		const passwordHash = await this.passwordHasherPort.hash(password);
		const deviceId = this.encryptionDecryptionPort.generateRandomToken(16);

		this.logger.debug(`Password email: ${decrypted.email}`);
		this.logger.debug(`Password hashed: ${passwordHash}`);
		this.logger.debug(`Generated device ID: ${deviceId}`);

		return this.unitOfWork.withTransaction(async (tx) => {
			// create the user
			const userCreated = await this.usersRepoAuthPort.create({ email: registration.email, firstName, lastName }, tx);

			// create the account
			const accountCreated = await this.accountsRepoAuthPort.createLocal({ userId: userCreated.id, passwordHash }, tx);

			// create the actor
			const actorCreated = await this.actorsRepoAuthPort.create(userCreated.id, tx);

			// generate refresh token
			const { value: refreshToken, expiresAt: refreshTokenExpiresAt } =
				await this.tokenizerPort.generateRefreshToken(deviceId);
			const refreshTokenHash = this.encryptionDecryptionPort.hashFromSecret(
				refreshToken,
				this.jwtCfg.refreshTokenSecret,
			);

			// create the session
			const sessionCreated = await this.sessionsRepoAuthPort.create(
				{
					userId: userCreated.id,
					accountId: accountCreated.id,
					actorId: actorCreated.id,
					refreshTokenHash,
					userAgent,
					ipAddress,
					deviceId,
					expiresAt: refreshTokenExpiresAt,
				},
				tx,
			);

			//  generate access token
			const { value: accessToken, expiresAt: accessTokenExpiresAt } = await this.tokenizerPort.generateAccessToken({
				userId: userCreated.id,
				accountId: accountCreated.id,
				actorId: actorCreated.id,
				sessionId: sessionCreated.id,
			});

			// delete the registration and cooldown
			await this.registrationsRepoAuthPort.deleteById(registration.id, tx);
			await this.registerCooldownPort.deleteCooldown(decrypted.email, tx);

			return {
				userId: userCreated.id,
				accountId: accountCreated.id,
				actorId: actorCreated.id,
				sessionId: sessionCreated.id,
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenExpiresAt,
			};
		});
	}
}
