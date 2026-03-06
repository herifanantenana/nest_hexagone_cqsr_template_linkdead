import { RedisService } from "@apk_common/infra/redis/redis.service";
import { RegisterCooldownPort } from "@apk_modules/auth/application/ports/register-cooldown.port";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

const REGISTER_COOLDOWN = "register:cooldown";

@Injectable()
export class RegisterCooldownRedisAdapter implements RegisterCooldownPort {
	private readonly redisClient: Redis;

	constructor(private readonly redisService: RedisService) {
		this.redisClient = this.redisService.getClient();
	}

	async isOnCooldown(email: string): Promise<boolean> {
		const key = `${REGISTER_COOLDOWN}:${email}`;
		const exists = await this.redisClient.exists(key);
		return !!exists;
	}

	async start(email: string, token: string, ttlSec: number): Promise<void> {
		const key = `${REGISTER_COOLDOWN}:${email}`;
		await this.redisClient.set(key, token, "EX", ttlSec);
	}

	async getCooldownToken(email: string): Promise<string | null> {
		const key = `${REGISTER_COOLDOWN}:${email}`;
		return await this.redisClient.get(key);
	}

	async delete(email: string): Promise<void> {
		const key = `${REGISTER_COOLDOWN}:${email}`;
		await this.redisClient.del(key);
	}
}
