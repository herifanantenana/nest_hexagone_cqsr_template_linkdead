import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module";
import { IoredisAdapter, REDIS_CLIENT } from "./adapters/ioredis.adapter";
import { RedisSafeAction } from "./redis-safe-action";
import { RedisService } from "./redis.service";

@Module({
	imports: [LoggerModule],
	providers: [
		IoredisAdapter,
		{
			provide: REDIS_CLIENT,
			useFactory: (ioredisAdapter: IoredisAdapter) => ioredisAdapter.getClient(),
			inject: [IoredisAdapter],
		},
		RedisService,
		RedisSafeAction,
	],
	exports: [RedisService, RedisSafeAction],
})
export class RedisModule {}
