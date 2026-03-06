import appEnvConfig from "@apk_common/config/app-env.config";
import authEnvConfig from "@apk_common/config/auth-env.config";
import databaseEnvConfig from "@apk_common/config/database-env.config";
import jwtEnvConfig from "@apk_common/config/jwt-env.config";
import loggerEnvConfig from "@apk_common/config/logger-env.config";
import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import rateLimitEnvConfig from "@apk_common/config/rate-limit-env.config";
import redisEnvConfig from "@apk_common/config/redis-env.config";
import { InfraModule } from "@apk_common/infra/infra.module";
import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { AllHttpExceptionsFilter } from "@apk_common/interface/http/filters/all-http-exceptions.filter";
import { HttpEnvelopeInterceptor } from "@apk_common/interface/http/interceptors/http-envelope.interceptor";
import { RequestIdMiddleware } from "@apk_common/interface/http/middlewares/request-id.middleware";
import { AuthModule } from "@apk_modules/auth/auth.module";
import { UserModule } from "@apk_modules/user/user.module";
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: `.env${process.env.NODE_ENV?.length ? `.${process.env.NODE_ENV}` : ""}`,
			load: [
				appEnvConfig,
				databaseEnvConfig,
				loggerEnvConfig,
				redisEnvConfig,
				mailerEnvConfig,
				rateLimitEnvConfig,
				authEnvConfig,
				jwtEnvConfig,
			],
		}),
		InfraModule,
		UserModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_FILTER,
			useClass: AllHttpExceptionsFilter,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: HttpEnvelopeInterceptor,
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
