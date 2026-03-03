import appEnvConfig from "@apk_common/config/app-env.config";
import databaseEnvConfig from "@apk_common/config/database-env.config";
import loggerEnvConfig from "@apk_common/config/logger-env.config";
import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import redisEnvConfig from "@apk_common/config/redis-env.config";
import { DatabaseModule } from "@apk_common/infra/database/database.module";
import { LoggerModule } from "@apk_common/infra/logger/logger.module";
import { MailerModule } from "@apk_common/infra/mailer/mailer.module";
import { RedisModule } from "@apk_common/infra/redis/redis.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`,
			load: [appEnvConfig, databaseEnvConfig, loggerEnvConfig, redisEnvConfig, mailerEnvConfig],
		}),
		LoggerModule,
		DatabaseModule,
		RedisModule,
		MailerModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
