import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { MailerModule } from "./mailer/mailer.module";
import { BullmqModule } from "./queue/bullmq.module";
import { RateLimitModule } from "./rate-limit/rate-limit.module";
import { RedisModule } from "./redis/redis.module";

@Module({
	imports: [LoggerModule, DatabaseModule, MailerModule, RedisModule, BullmqModule, RateLimitModule],
	exports: [LoggerModule, DatabaseModule, MailerModule, RedisModule, BullmqModule, RateLimitModule],
})
export class InfraModule {}
