import appEnvConfig from "@apk_common/config/app-env.config";
import databaseEnvConfig from "@apk_common/config/database-env.config";
import loggerEnvConfig from "@apk_common/config/logger-env.config";
import redisEnvConfig from "@apk_common/config/redis-env.config";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`,
			load: [appEnvConfig, databaseEnvConfig, loggerEnvConfig, redisEnvConfig],
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
