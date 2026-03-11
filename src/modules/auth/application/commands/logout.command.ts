import { jwtConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { EncryptionDecryptionPort } from "../ports/encryption-decryption.port";
import { SessionsCachePort } from "../ports/sessions-cache.port";
import { SessionsRepoAuthPort } from "../ports/sessions-repo-auth.port";

export class LogoutCommand {
	constructor(
		public readonly sessionId?: string,
		public readonly refreshToken?: string,
	) {}
}

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, void> {
	constructor(
		private readonly logger: AppLogger,
		private readonly encryptionDecryptionPort: EncryptionDecryptionPort,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
		private readonly sessionsRepoAuthPort: SessionsRepoAuthPort,
		private readonly sessionsCachePort: SessionsCachePort,
	) {}

	async execute(command: LogoutCommand): Promise<void> {
		const { sessionId, refreshToken } = command;

		let sessionIdToRevoke: string | null = sessionId ?? null;
		if (!sessionId && refreshToken) {
			const refreshTokenHash = this.encryptionDecryptionPort.hashFromSecret(
				refreshToken,
				this.jwtCfg.refreshTokenSecret,
			);

			const session = await this.sessionsRepoAuthPort.findByRefreshTokenHash(refreshTokenHash);
			sessionIdToRevoke = session?.id ?? null;
		}

		if (!sessionIdToRevoke) {
			this.logger.debug("Logout called without resolvable sessionId (idempotent)");
			return;
		}

		await this.sessionsRepoAuthPort.revokeById(sessionIdToRevoke);
		await this.sessionsCachePort.deleteSession(sessionIdToRevoke);
	}
}
