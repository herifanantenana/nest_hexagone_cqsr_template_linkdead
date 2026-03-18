import { jwtConfig } from "@apk_core/config";
import { type TJwtConfig } from "@apk_core/config/root.config";
import { EActorTypes } from "@apk_infra/database/schemas/database.type";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { InvalidCredentialsException } from "@apk_modules/auth/domain/exceptions/auth-business.exception";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AccountsRepoAuthPort } from "../ports/accounts-repo-auth.port";
import { ActorsRepoAuthPort } from "../ports/actors-repo-auth.port";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { PasswordHasherPort } from "../ports/password-hasher.port";
import { SessionsCachePort } from "../ports/sessions-cache.port";
import { SessionsRepoAuthPort } from "../ports/sessions-repo-auth.port";
import { TokenizerPort } from "../ports/tokenizer.port";
import { UsersRepoAuthPort } from "../ports/users-repo-auth.port";

export class LoginCommand {
	constructor(
		public readonly email: string,
		public readonly password: string,
		public readonly userAgent: string,
		public readonly ipAddress: string,
	) {}
}

export interface ILoginCommandResult {
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand, ILoginCommandResult> {
	constructor(
		private readonly logger: AppLogger,
		private readonly usersRepoAuthPort: UsersRepoAuthPort,
		private readonly accountsRepoAuthPort: AccountsRepoAuthPort,
		private readonly passwordHasherPort: PasswordHasherPort,
		private readonly actorsRepoAuthPort: ActorsRepoAuthPort,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		private readonly tokenizerPort: TokenizerPort,
		private readonly sessionsRepoAuthPort: SessionsRepoAuthPort,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
		private readonly sessionsCachePort: SessionsCachePort,
	) {
		this.logger = this.logger.withContext(LoginCommandHandler.name);
	}

	async execute(command: LoginCommand): Promise<ILoginCommandResult> {
		const { email, password, userAgent, ipAddress } = command;

		// find the user by email
		const user = await this.usersRepoAuthPort.findIdByEmail(email);
		if (!user) throw new InvalidCredentialsException();

		// check account
		const account = await this.accountsRepoAuthPort.findAuthByUserId(user.id);
		if (!account) throw new InvalidCredentialsException();
		if (account.passwordHash === null) throw new InvalidCredentialsException();

		// verify password
		if (!(await this.passwordHasherPort.verify(password, account.passwordHash)))
			throw new InvalidCredentialsException();

		// check actor
		const actor = await this.actorsRepoAuthPort.findIdByUserId(user.id);
		if (!actor) throw new InvalidCredentialsException();

		const deviceId = this.encryptionDecryptionPort.generateRandomToken(16);
		const { value: refreshToken, expiresAt: refreshTokenExpiresAt } =
			await this.tokenizerPort.generateRefreshToken(deviceId);
		const refreshTokenHash = this.encryptionDecryptionPort.hashFromSecret(refreshToken, this.jwtCfg.refreshTokenSecret);

		// create session
		const session = await this.sessionsRepoAuthPort.create({
			userId: user.id,
			accountId: account.id,
			actorId: actor.id,
			refreshTokenHash,
			userAgent,
			ipAddress,
			deviceId,
			expiresAt: refreshTokenExpiresAt,
		});

		//  generate access token
		const { value: accessToken, expiresAt: accessTokenExpiresAt } = await this.tokenizerPort.generateAccessToken({
			userId: user.id,
			accountId: account.id,
			actorId: actor.id,
			sessionId: session.id,
			contextType: EActorTypes.USER,
		});

		// add token cache
		await this.sessionsCachePort.setSession({
			sessionId: session.id,
			userId: user.id,
			accountId: account.id,
			actorId: actor.id,
			refreshTokenHash,
			expiresAt: refreshTokenExpiresAt,
			contextType: EActorTypes.USER,
		});

		return {
			accessToken,
			accessTokenExpiresAt,
			refreshToken,
			refreshTokenExpiresAt,
		};
	}
}
