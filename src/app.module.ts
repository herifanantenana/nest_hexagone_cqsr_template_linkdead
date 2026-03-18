import * as config from "@apk_core/config/root.config";
import { LoggerModule } from "@apk_infra/logger/logger.module";
import { MailerModule } from "@apk_infra/mailer/mailer.module";
import { RedisModule } from "@apk_infra/redis/redis.module";
import { Module } from "@nestjs/common";
import { ConfigFactory, ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			envFilePath: `.env.${process.env.APP_RUNTIME ?? "dev"}`,
			load: Object.values(config as Record<string, ConfigFactory>),
		}),
		LoggerModule,
		RedisModule,
		MailerModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
