import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";
import { RedisModule } from "./redis/redis.module";
import { MailerModule } from "./mailer/mailer.module";

@Global()
@Module({
	imports: [LoggerModule, DatabaseModule, RedisModule, MailerModule],
	exports: [LoggerModule, DatabaseModule, RedisModule, MailerModule],
})
export class InfraModule {}
