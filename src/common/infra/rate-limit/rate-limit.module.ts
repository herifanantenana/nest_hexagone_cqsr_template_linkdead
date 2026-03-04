import throttlerEnvConfig from "@apk_common/config/throttler-env.config";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Module } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { RedisModule } from "../redis/redis.module";
import { RedisService } from "../redis/redis.service";

export const THROTTLER_REGISTER = "THROTTLER_REGISTER";

export const THROTTLE_ENABLED_KEY = "THROTTLE_ENABLED_KEY";

@Module({
	imports: [
		ThrottlerModule.forRootAsync({
			imports: [RedisModule],
			inject: [RedisService, throttlerEnvConfig.KEY],
			useFactory: (redisService: RedisService, throttlerConfig: ConfigType<typeof throttlerEnvConfig>) => ({
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
