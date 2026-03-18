import { EActorTypes } from "@apk_infra/database/schemas/database.type";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { TJwtAuthPayload, TReqAuthContext } from "@apk_modules/auth/types/auth.types";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SessionsCachePort } from "../ports/sessions-cache.port";
import { SessionsRepoAuthPort } from "../ports/sessions-repo-auth.port";

@Injectable()
export class RequestAuthResolverService {
	constructor(
		private readonly logger: AppLogger,
		private readonly sessionsCachePort: SessionsCachePort,
		private readonly sessionsRepoAuthPort: SessionsRepoAuthPort,
	) {
		this.logger = this.logger.withContext(RequestAuthResolverService.name);
	}

	async resolve(payloadJwt: TJwtAuthPayload): Promise<TReqAuthContext> {
		// get all data from payload
		const userId = payloadJwt.uid ?? payloadJwt.sub;
		const { acid: accountId, atid: actorId, sid: sessionId } = payloadJwt;
		const now = Date.now();

		if (!userId || !accountId || !actorId || !sessionId) {
			throw new UnauthorizedException("Invalid token payload");
		}

		// get the session data from cache
		const sessionCache = await this.sessionsCachePort.getSession(sessionId);
		if (sessionCache) {
			// check expiration			const now = Date.now();
			if (sessionCache.expiresAt.getTime() <= now || !sessionCache.refreshTokenHash) {
				throw new UnauthorizedException("Session expired");
			}
			// validate session data with payload
			if (sessionCache.userId !== userId || sessionCache.accountId !== accountId || sessionCache.actorId !== actorId) {
				throw new UnauthorizedException("Session data mismatch");
			}
			return {
				userId,
				accountId,
				actorId,
				sessionId,
			};
		}

		this.logger.debug(`Session data not found in cache for sessionId ${sessionId}, trying to resolve from db...`);
		// session data not found in cache, try to get it from db
		const sessionDb = await this.sessionsRepoAuthPort.findById(sessionId);
		if (!sessionDb) {
			throw new UnauthorizedException("Session not found");
		}

		// check if session is still valid
		if (sessionDb.revokedAt || sessionDb.expiresAt.getTime() <= now) {
			throw new UnauthorizedException("Session expired or revoked");
		}
		if (sessionDb.userId !== userId || sessionDb.accountId !== accountId || sessionDb.actorId !== actorId) {
			throw new UnauthorizedException("Session data mismatch");
		}

		// add session data to cache
		const organizationId =
			sessionDb.actor.type === EActorTypes.ORGANIZATION ? (sessionDb.actor.organizationId ?? undefined) : undefined;
		await this.sessionsCachePort.setSession({
			sessionId: sessionDb.id,
			userId: sessionDb.userId,
			accountId: sessionDb.accountId,
			actorId: sessionDb.actorId,
			refreshTokenHash: sessionDb.refreshTokenHash,
			expiresAt: sessionDb.expiresAt,
			contextType: sessionDb.actor.type,
			organizationId,
		});

		return {
			userId,
			accountId,
			actorId,
			sessionId,
			organizationId,
		};
	}
}
