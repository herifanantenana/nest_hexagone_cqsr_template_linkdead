import { LoggerModule } from "@apk_infra/logger/logger.module";
import { RedisModule } from "@apk_infra/redis/redis.module";
import { Module } from "@nestjs/common";
import { ThrottlerAdapter } from "./throttler.adapter";

@Module({
	imports: [LoggerModule, RedisModule],
	providers: [ThrottlerAdapter],
	exports: [ThrottlerAdapter],
})
export class ThrottlerAdapterModule {}
