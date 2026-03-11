import { jwtConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { Inject, UnauthorizedException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { SessionsCachePort } from "../ports/sessions-cache.port";
import { SessionsRepoAuthPort } from "../ports/sessions-repo-auth.port";
import { TokenizerPort } from "../ports/tokenizer.port";

export class RefreshAccessTokenCommand {
	constructor(
		public readonly refreshToken: string,
		public readonly userAgent: string,
		public readonly ipAddress: string,
	) {}
}

export interface IRefreshAccessTokenCommandResult {
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

@CommandHandler(RefreshAccessTokenCommand)
export class RefreshAccessTokenCommandHandler implements ICommandHandler<
	RefreshAccessTokenCommand,
	IRefreshAccessTokenCommandResult
> {
	constructor(
		private readonly logger: AppLogger,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
		private readonly sessionsRepoAuthPort: SessionsRepoAuthPort,
		private readonly tokenizerPort: TokenizerPort,
		private readonly sessionsCachePort: SessionsCachePort,
	) {
		this.logger = this.logger.withContext(RefreshAccessTokenCommandHandler.name);
	}

	async execute(command: RefreshAccessTokenCommand): Promise<IRefreshAccessTokenCommandResult> {
		const { refreshToken, userAgent, ipAddress } = command;

		// hash the refreshToken to compare
		const refreshTokenHash = this.encryptionDecryptionPort.hashFromSecret(refreshToken, this.jwtCfg.refreshTokenSecret);

		// get the corresponding session
		const session = await this.sessionsRepoAuthPort.findByRefreshTokenHash(refreshTokenHash);
		if (!session) throw new UnauthorizedException("Invalid refresh token");

		// validate session
		const now = Date.now();
		if (session.revokedAt) throw new UnauthorizedException("Refresh token has been revoked");
		if (session.expiresAt.getTime() <= now) throw new UnauthorizedException("Refresh token has expired");

		// create a new refresh token
		const { value: newRefreshToken, expiresAt: newRefreshTokenExpiresAt } =
			await this.tokenizerPort.generateRefreshToken(session.deviceId);
		const newRefreshTokenHash = this.encryptionDecryptionPort.hashFromSecret(
			newRefreshToken,
			this.jwtCfg.refreshTokenSecret,
		);
		// check if user agent or ip address has changed, for now just log
		if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
			this.logger.warn(
				`User agent or IP address has changed for session ${session.id}. Previous user agent: ${session.userAgent}, previous IP address: ${session.ipAddress}, new user agent: ${userAgent}, new IP address: ${ipAddress}`,
			);
		}

		// rotate the refresh token in the session
		await this.sessionsRepoAuthPort.rotateRefreshToken({
			sessionId: session.id,
			newRefreshTokenHash,
			newExpiresAt: newRefreshTokenExpiresAt,
		});

		// generate a new access token
		const { value: newAccessToken, expiresAt: newAccessTokenExpiresAt } = await this.tokenizerPort.generateAccessToken({
			userId: session.userId,
			accountId: session.accountId,
			actorId: session.actorId,
			sessionId: session.id,
		});

		// rotate the session cache with the new refresh token hash and expiry
		await this.sessionsCachePort.deleteSession(session.id);
		await this.sessionsCachePort.setSession({
			sessionId: session.id,
			userId: session.userId,
			accountId: session.accountId,
			actorId: session.actorId,
			refreshTokenHash: newRefreshTokenHash,
			expiresAt: newRefreshTokenExpiresAt,
		});

		return {
			accessToken: newAccessToken,
			accessTokenExpiresAt: newAccessTokenExpiresAt,
			refreshToken: newRefreshToken,
			refreshTokenExpiresAt: newRefreshTokenExpiresAt,
		};
	}
}
