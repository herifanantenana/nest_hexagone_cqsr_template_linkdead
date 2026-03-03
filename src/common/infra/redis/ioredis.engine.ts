import redisEnvConfig from "@apk_common/config/redis-env.config";
import { Inject, Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import Redis from "ioredis";
import { AppLogger } from "../logger/logger.service";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Injectable()
export class IoredisEngineService implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
	private redis: Redis;
	private readonly logger: AppLogger;
	private isShuttingDown = false;

	constructor(
		@Inject(redisEnvConfig.KEY) private readonly redisConfig: ConfigType<typeof redisEnvConfig>,
		private appLogger: AppLogger,
	) {
		this.logger = this.appLogger.withContext(IoredisEngineService.name);

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
		this.logger.log("Redis ioredis client engine initialized and connected to Redis");
	}

	async onModuleDestroy() {
		await this.disconnectRedis("onModuleDestroy");
	}

	async onApplicationShutdown() {
		await this.disconnectRedis("onApplicationShutdown");
	}

	private async disconnectRedis(source: string) {
		if (this.isShuttingDown) {
			this.logger.debug(`Redis already disconnecting/disconnected, skipping ${source}`);
			return;
		}

		this.isShuttingDown = true;
		try {
			await this.redis.quit();
			this.logger.log(`Redis client disconnected (${source})`);
		} catch (error) {
			this.logger.warn(`Error disconnecting Redis client (${source}): ${error}`);
			this.redis.disconnect();
		}
	}

	public getClient(): Redis {
		return this.redis;
	}
}
