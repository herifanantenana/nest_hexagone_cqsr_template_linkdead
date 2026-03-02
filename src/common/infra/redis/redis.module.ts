import { Global, Module } from "@nestjs/common";
import { IoredisEngineService, REDIS_CLIENT } from "./ioredis.engine";
import { RedisService } from "./redis.service";

@Global()
@Module({
	providers: [
		IoredisEngineService,
		{
			provide: REDIS_CLIENT,
			useFactory: (ioredisEngineService: IoredisEngineService) => ioredisEngineService.getClient(),
			inject: [IoredisEngineService],
		},
		RedisService,
	],
	exports: [RedisService],
})
export class RedisModule {}
