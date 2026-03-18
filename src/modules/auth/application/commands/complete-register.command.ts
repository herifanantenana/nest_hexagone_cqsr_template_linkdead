import { jwtConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { EActorTypes } from "@apk_infra/database/schemas/database.type";
import { AppLogger } from "@apk_infra/logger/logger.service";
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
import { RegisterTokenValidatorService } from "../services/register-token-validator.service";

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
		private readonly registerTokenValidatorService: RegisterTokenValidatorService,
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

		// validate registration token (decrypt, cooldown, DB match, expiration)
		const { decrypted, registration } = await this.registerTokenValidatorService.validate(tokenEncrypted);

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
				contextType: EActorTypes.USER,
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
			contextType: EActorTypes.USER,
		});

		// No need to delete refreshTokenHash from result
		return {
			accessToken: result.accessToken,
			accessTokenExpiresAt: result.accessTokenExpiresAt,
			refreshToken: result.refreshToken,
			refreshTokenExpiresAt: result.refreshTokenExpiresAt,
		};
	}
}
