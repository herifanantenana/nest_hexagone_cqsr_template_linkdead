import { Global, Module } from "@nestjs/common";
import { IoredisAdapter, REDIS_CLIENT } from "./ioredis.adapter";
import { RedisService } from "./redis.service";

@Global()
@Module({
	providers: [
		IoredisAdapter,
		{
			provide: REDIS_CLIENT,
			useFactory: (ioredisAdapter: IoredisAdapter) => ioredisAdapter.getClient(),
			inject: [IoredisAdapter],
		},
		RedisService,
	],
	exports: [RedisService],
})
export class RedisModule {}
