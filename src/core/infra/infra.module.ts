import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { MailerModule } from "./mailer/mailer.module";
import { RateLimitModule } from "./rate-limit/rate-limit.module";
import { RedisModule } from "./redis/redis.module";

@Module({
	imports: [LoggerModule, DatabaseModule, RedisModule, MailerModule, RateLimitModule],
	exports: [LoggerModule, DatabaseModule, RedisModule, MailerModule, RateLimitModule],
})
export class InfraModule {}
