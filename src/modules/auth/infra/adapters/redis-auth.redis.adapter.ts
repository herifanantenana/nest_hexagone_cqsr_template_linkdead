import { RedisService } from "@apk_common/infra/redis/redis.service";
import { RedisAuthPort } from "@apk_modules/auth/application/ports/redis-auth.port";
import { Injectable } from "@nestjs/common";

const REDIS_KEY_PREFIX_REGISTER_COOLDOWN = "register_cooldown";

@Injectable()
export class RedisAuthRedisAdapter implements RedisAuthPort {
	constructor(private readonly redisService: RedisService) {}

	async getTokenCoolDownRegister(email: string): Promise<string | null> {
		const redisClient = this.redisService.getClient();
		const key = `${REDIS_KEY_PREFIX_REGISTER_COOLDOWN}:${email}`;
		return await redisClient.get(key);
	}

	async setTokenCoolDownRegister(email: string, token: string, expiresInSeconds: number): Promise<void> {
		const redisClient = this.redisService.getClient();
		const key = `${REDIS_KEY_PREFIX_REGISTER_COOLDOWN}:${email}`;
		await redisClient.set(key, token, "EX", expiresInSeconds);
	}
}
