import { Module } from "@nestjs/common";

import { LoggerModule } from "./logger/logger.module";
import { MailerModule } from "./mailer/mailer.module";
import { BullmqModule } from "./queue/bullmq.module";
import { RateLimitModule } from "./rate-limit/rate-limit.module";
import { RedisModule } from "./redis/redis.module";

@Module({
	imports: [LoggerModule, MailerModule, RedisModule, BullmqModule, RateLimitModule],
	exports: [LoggerModule, MailerModule, RedisModule, BullmqModule, RateLimitModule],
})
export class InfraModule {}
