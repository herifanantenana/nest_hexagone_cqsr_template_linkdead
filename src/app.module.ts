import appEnvConfig from "@apk_common/config/app-env.config";
import databaseEnvConfig from "@apk_common/config/database-env.config";
import loggerEnvConfig from "@apk_common/config/logger-env.config";
import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import redisEnvConfig from "@apk_common/config/redis-env.config";
import { DatabaseModule } from "@apk_common/infra/database/database.module";
import { LoggerModule } from "@apk_common/infra/logger/logger.module";
import { MailerModule } from "@apk_common/infra/mailer/mailer.module";
import { RedisModule } from "@apk_common/infra/redis/redis.module";
import { HttpTransactionInterceptor } from "@apk_common/interface/http/interceptors/http-transaction.interceptor";
import { RequestIdMiddleware } from "@apk_common/interface/http/middlewares/request-id.middleware";
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppLogger } from "@apk_common/infra/logger/logger.service";

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
	providers: [
		AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: HttpTransactionInterceptor,
		},
	],
})
export class AppModule implements NestModule {
	private readonly logger: AppLogger;
	constructor(private readonly appLogger: AppLogger) {
		this.logger = this.appLogger.withContext(AppModule.name);
	}
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestIdMiddleware).forRoutes({ path: "", method: RequestMethod.ALL });
		this.logger.log("RequestIdMiddleware initialized to all routes");
	}
}
