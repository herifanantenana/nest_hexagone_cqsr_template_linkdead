import rateLimitEnvConfig from "@apk_common/config/rate-limit-env.config";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Module } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { RedisModule } from "../redis/redis.module";
import { RedisService } from "../redis/redis.service";

export const THROTTLER_REGISTER = "THROTTLER_REGISTER";

export const RATE_LIMIT_ENABLED_KEY = "RATE_LIMIT_ENABLED_KEY";

@Module({
	imports: [
		RedisModule,
		ThrottlerModule.forRootAsync({
			imports: [RedisModule],
			inject: [RedisService, rateLimitEnvConfig.KEY],
			useFactory: (redisService: RedisService, throttlerConfig: ConfigType<typeof rateLimitEnvConfig>) => ({
				throttlers: [
					{
						name: THROTTLER_REGISTER,
						ttl: seconds(throttlerConfig.registerTtlSeconds),
						limit: throttlerConfig.registerLimit,
					},
				],
				storage: new ThrottlerStorageRedisService(redisService.getClient()),
			}),
		}),
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
	exports: [ThrottlerModule],
})
export class RateLimitModule {}
