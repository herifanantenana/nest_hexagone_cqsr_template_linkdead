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
import { SessionsCachePort } from "../ports/sessions-cache.port";
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
		private readonly sessionsCachePort: SessionsCachePort,
	) {
		this.logger = this.logger.withContext(CompleteRegisterCommandHandler.name);
	}

	async execute(command: CompleteRegisterCommand): Promise<ICompleteRegisterCommandResult> {
		const { tokenEncrypted, firstName, lastName, password, userAgent, ipAddress } = command;

		// validate the input
		this.authValidatorService.validateName(firstName);
		this.authValidatorService.validateName(lastName);
		this.authValidatorService.validatePassword(password);

		/// decrypt the token and get the email
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

		// check if token is valid on database
		const registration = await this.registrationsRepoAuthPort.findByEmail(decrypted.email);
		const tokenHash = this.encryptionDecryptionPort.hashFromSecret(decrypted.token, this.authCfg.registerTokenSecret);
		if (!registration || registration.tokenHash !== tokenHash) throw new InvalidRegistrationTokenException();

		// check if toke expiration still under the session
		if (registration.expiresAt.getTime() <= Date.now()) throw new InvalidRegistrationTokenException();

		// hash password
		const passwordHash = await this.passwordHasherPort.hash(password);
		const deviceId = this.encryptionDecryptionPort.generateRandomToken(16);

		const result = await this.unitOfWork.withTransaction(async (tx) => {
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

			return {
				userId: userCreated.id,
				accountId: accountCreated.id,
				actorId: actorCreated.id,
				sessionId: sessionCreated.id,
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenHash,
				refreshTokenExpiresAt,
			};
		});

		// delete the registration and cooldown
		await this.registrationsRepoAuthPort.deleteById(registration.id);
		await this.registerCooldownPort.deleteCooldown(decrypted.email);

		// add token cache
		await this.sessionsCachePort.setSession({
			sessionId: result.sessionId,
			userId: result.userId,
			accountId: result.accountId,
			actorId: result.actorId,
			refreshTokenHash: result.refreshTokenHash,
			expiresAt: result.refreshTokenExpiresAt,
		});

		// No need to delete refreshTokenHash from result
		return {
			userId: result.userId,
			accountId: result.accountId,
			actorId: result.actorId,
			sessionId: result.sessionId,
			accessToken: result.accessToken,
			accessTokenExpiresAt: result.accessTokenExpiresAt,
			refreshToken: result.refreshToken,
			refreshTokenExpiresAt: result.refreshTokenExpiresAt,
		};
	}
}
