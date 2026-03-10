import { AppLogger } from "@apk_infra/logger/logger.service";
import { RedisSafeAction } from "@apk_infra/redis/redis-safe-action";
import { RedisService } from "@apk_infra/redis/redis.service";
import { RegisterCooldownPort } from "@apk_modules/auth/application/ports/register-cooldown.port";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

const REGISTER_COOLDOWN_PREFIX = "register:cooldown";

@Injectable()
export class RegisterCooldownRedisAdapter implements RegisterCooldownPort {
	private readonly redisClient: Redis;

	constructor(
		private readonly logger: AppLogger,
		private readonly redisService: RedisService,
		private readonly redisSafeAction: RedisSafeAction,
	) {
		this.logger = this.logger.withContext(RegisterCooldownRedisAdapter.name);
		this.redisClient = this.redisService.getClient();
	}

	async isOnEmailCooldown(email: string): Promise<boolean> {
		const key = `${REGISTER_COOLDOWN_PREFIX}:${email}`;
		const result = await this.redisSafeAction.withSafeAsyncOrThrow(async () => {
			const value = await this.redisClient.exists(key);
			return !!value;
		});
		return result;
	}

	async start(email: string, token: string, ttlSec: number): Promise<void> {
		const key = `${REGISTER_COOLDOWN_PREFIX}:${email}`;
		await this.redisSafeAction.withSafeAsyncOrThrow(async () => {
			await this.redisClient.set(key, token, "EX", ttlSec);
		});
	}

	async getCooldownToken(email: string): Promise<string | null> {
		const key = `${REGISTER_COOLDOWN_PREFIX}:${email}`;
		const result = await this.redisSafeAction.withSafeAsync(async () => {
			const value = await this.redisClient.get(key);
			return value;
		});
		if (!result.ok) return null;
		return result.data;
	}

	async deleteCooldown(email: string): Promise<void> {
		const key = `${REGISTER_COOLDOWN_PREFIX}:${email}`;
		const result = await this.redisSafeAction.withSafeAsync(async () => {
			await this.redisClient.del(key);
		});
		if (!result.ok) {
			this.logger.error("Failed to delete register cooldown", { email, error: result.error });
		}
	}
}
