import redisEnvConfig from "@apk_common/config/redis-env.config";
import { Inject, Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import Redis from "ioredis";
import { AppLogger } from "../logger/logger.service";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Injectable()
export class IoredisEngineService implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
	private redis: Redis;

	constructor(
		@Inject(redisEnvConfig.KEY) private readonly redisConfig: ConfigType<typeof redisEnvConfig>,
		private logger: AppLogger,
	) {
		this.logger = logger.withContext(IoredisEngineService.name);

		this.redis = new Redis(`redis://${this.redisConfig.host}:${this.redisConfig.port}`, {
			keyPrefix: this.redisConfig.prefix + ":",
			maxRetriesPerRequest: 2,
			enableReadyCheck: true,
			lazyConnect: false,
		});

		this.redis.on("error", (err) => {
			this.logger.error(`Redis error: ${err?.message ?? err}`);
		});

		this.redis.on("ready", () => {
			this.logger.log("Redis client ready");
		});
	}

	async onModuleInit() {
		await this.redis.ping();
		this.logger.log("Redis connected (PING ok)");
	}

	async onModuleDestroy() {
		try {
			await this.redis.quit();
			this.logger.log("Redis client disconnected");
		} catch (error) {
			this.logger.error(`Error disconnecting Redis client:${error}`);
			this.redis.disconnect();
		}
	}

	async onApplicationShutdown() {
		try {
			await this.redis.quit();
			this.logger.log("Redis client disconnected on application shutdown");
		} catch (error) {
			this.logger.error(`Error disconnecting Redis client on shutdown:${error}`);
			this.redis.disconnect();
		}
	}

	public getClient(): Redis {
		return this.redis;
	}
}
