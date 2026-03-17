import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { MailerModule } from "./mailer/mailer.module";
import { RateLimitModule } from "./rate-limit/rate-limit.module";
import { RedisModule } from "./redis/redis.module";
import { UploadsModule } from "./uploads/uploads.module";

@Global()
@Module({
	imports: [LoggerModule, DatabaseModule, RedisModule, MailerModule, RateLimitModule, UploadsModule],
	exports: [LoggerModule, DatabaseModule, RedisModule, MailerModule, RateLimitModule, UploadsModule],
})
export class InfraModule {}
