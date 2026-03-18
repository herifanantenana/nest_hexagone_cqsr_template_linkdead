import * as config from "@apk_core/config/root.config";
import { LoggerModule } from "@apk_infra/logger/logger.module";
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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
