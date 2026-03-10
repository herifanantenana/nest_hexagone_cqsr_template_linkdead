import { AppLogger } from "@apk_infra/logger/logger.service";
import { RedisSafeAction } from "@apk_infra/redis/redis-safe-action";
import { RedisService } from "@apk_infra/redis/redis.service";
import { ISessionCacheData, SessionsCachePort } from "@apk_modules/auth/application/ports/sessions-cache.port";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

const SESSIONS_CACHE_PREFIX = "auth:sessions:cache";

@Injectable()
export class SessionCacheRedisAdapter implements SessionsCachePort {
	private readonly redisClient: Redis;

	private key(sessionId: string) {
		return `${SESSIONS_CACHE_PREFIX}:${sessionId}`;
	}

	private ttlSeconds(expiresAt: Date) {
		const ms = expiresAt.getTime() - Date.now();
		return Math.max(1, Math.floor(ms / 1000));
	}

	constructor(
		private readonly logger: AppLogger,
		private readonly redisService: RedisService,
		private readonly redisSafeAction: RedisSafeAction,
	) {
		this.logger = this.logger.withContext(SessionCacheRedisAdapter.name);
		this.redisClient = this.redisService.getClient();
	}

	async setSession(input: ISessionCacheData): Promise<void> {
		const key = this.key(input.sessionId);
		const value = JSON.stringify({ ...input, expiresAt: input.expiresAt.toISOString() });
		const ttlSec = this.ttlSeconds(input.expiresAt);
		await this.redisSafeAction.withSafeAsyncOrThrow(async () => {
			await this.redisClient.set(key, value, "EX", ttlSec);
		});
	}

	async getSession(sessionId: string): Promise<ISessionCacheData | null> {
		const key = this.key(sessionId);
		const result = await this.redisSafeAction.withSafeAsync(async () => {
			const value = await this.redisClient.get(key);
			return value;
		});
		if (!result.ok || !result.data) return null;
		const parsed = JSON.parse(result.data) as ISessionCacheData;
		return {
			...parsed,
			expiresAt: new Date(parsed.expiresAt),
		};
	}

	async deleteSession(sessionId: string): Promise<void> {
		const key = this.key(sessionId);
		const result = await this.redisSafeAction.withSafeAsync(async () => {
			await this.redisClient.del(key);
		});
		if (!result.ok) {
			this.logger.error("Failed to delete session cache", { sessionId, error: result.error });
		}
	}

	async rotateSession(sessionId: string, newRefreshToken: string, newExpiresAt: Date): Promise<void> {
		const result = await this.redisSafeAction.withSafeAsync(async () => {
			const existing = await this.getSession(sessionId);
			if (!existing) return null;

			await this.setSession({ ...existing, refreshToken: newRefreshToken, expiresAt: newExpiresAt });
		});
		if (!result.ok) {
			this.logger.error("Failed to rotate session cache", { sessionId, error: result.error });
		}
	}
}
