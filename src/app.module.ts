import { AllHttpExceptionsFilter } from "@apk_core/interface/http/filters/all-http-exceptions.filter";
import { HttpEnvelopeInterceptor } from "@apk_core/interface/http/interceptors/http-envelope.interceptor";
import { IncomingRequestMiddleware } from "@apk_core/interface/http/middlewares/incoming-request.middleware";
import { AuthModule } from "@apk_modules/auth/auth.module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import * as config from "./core/config";
import { InfraModule } from "./core/infra/infra.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			envFilePath: `.env.${process.env.APP_RUNTIME ?? "dev"}`,
			load: [...Object.values(config)],
		}),
		InfraModule,
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
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(IncomingRequestMiddleware).forRoutes("");
	}
}
