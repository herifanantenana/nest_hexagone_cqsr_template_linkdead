import { RedisSafeAction } from "@apk_infra/redis/redis-safe-action";
import { RegisterCooldownPort } from "@apk_modules/auth/application/ports/register-cooldown.port";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { RedisService } from "../../../../core/infra/redis/redis.service";

const REGISTER_COOLDOWN_PREFIX = "register:cooldown";

@Injectable()
export class RegisterCooldownRedisAdapter implements RegisterCooldownPort {
	private readonly redisClient: Redis;

	constructor(
		private readonly RedisService: RedisService,
		private readonly redisSafeAction: RedisSafeAction,
	) {
		this.redisClient = this.RedisService.getClient();
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
}
