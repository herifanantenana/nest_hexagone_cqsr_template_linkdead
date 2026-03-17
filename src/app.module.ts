import { AllHttpExceptionsFilter } from "@apk_core/interface/http/filters/all-http-exceptions.filter";
import { AppThrottlerGuard } from "@apk_core/interface/http/guards/rate-limiter/app-throttler.guard";
import { HttpEnvelopeInterceptor } from "@apk_core/interface/http/interceptors/http-envelope.interceptor";
import { IncomingRequestMiddleware } from "@apk_core/interface/http/middlewares/incoming-request.middleware";
import { UPLOADS_SERVER_ROOT_DIR } from "@apk_infra/uploads/uploads.constant";
import { AuthModule } from "@apk_modules/auth/auth.module";
import { JwtAuthGuard } from "@apk_modules/auth/interface/http/guards/jwt-auth-cookie.guard";
import { ExploitModule } from "@apk_modules/exploit/exploit.module";
import { TaxonomyModule } from "@apk_modules/taxonomy/taxonomy.module";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import * as config from "./core/config";
import { InfraModule } from "./core/infra/infra.module";

@Module({
	imports: [
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), "uploads"),
			useGlobalPrefix: true,
			serveRoot: UPLOADS_SERVER_ROOT_DIR,
			serveStaticOptions: {
				index: false,
				fallthrough: false,
				redirect: false,
			},
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			envFilePath: `.env.${process.env.APP_RUNTIME ?? "dev"}`,
			load: [...Object.values(config)],
		}),
		InfraModule,
		AuthModule,
		TaxonomyModule,
		ExploitModule,
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
		{
			provide: APP_GUARD,
			useExisting: AppThrottlerGuard,
		},
		{
			provide: APP_GUARD,
			useExisting: JwtAuthGuard,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(IncomingRequestMiddleware).forRoutes("");
	}
}
