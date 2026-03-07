import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { RedisModule } from "./redis/redis.module";

@Global()
@Module({
	imports: [LoggerModule, DatabaseModule, RedisModule],
	exports: [LoggerModule, DatabaseModule, RedisModule],
})
export class InfraModule {}
