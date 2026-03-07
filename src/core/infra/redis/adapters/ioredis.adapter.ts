import { redisConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_core/infra/logger/logger.service";
import { Inject, Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Injectable()
export class IoredisAdapter implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
	private redis: Redis;
	private readonly logger: AppLogger;
	private isShuttingDown = false;

	constructor(
		@Inject(redisConfig.KEY) private readonly redisCfg: ConfigType<typeof redisConfig>,
		private readonly appLogger: AppLogger,
	) {
		this.logger = this.appLogger.withContext(this.redisCfg.engine);

		this.redis = new Redis(`redis://${this.redisCfg.host}:${this.redisCfg.port}`, {
			keyPrefix: `${this.redisCfg.appKeyPrefix}:`,
			db: this.redisCfg.appDb,
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			lazyConnect: true,
		});

		this.redis.on("error", (err) => {
			this.logger.error(`Redis error: ${err?.message ?? err}`);
		});

		this.redis.on("ready", () => {
			this.logger.log(`${this.constructor.name} connection established`);
		});
	}

	async onModuleInit() {
		await this.redis.connect();
		await this.redis.ping();
		this.logger.log(`${this.constructor.name} ready and ping successful`);
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
