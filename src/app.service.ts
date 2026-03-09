import {
	TAppConfig,
	TClientAppConfig,
	TDatabaseConfig,
	TLoggerConfig,
	TMailerConfig,
	TRateLimiterConfig,
	TRedisConfig,
	TServerConfig,
} from "@apk_core/config/root.config";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
	constructor(private readonly configService: ConfigService) {}
	getHello() {
		const appConfig = this.configService.get<TAppConfig>("app");
		const serverConfig = this.configService.get<TServerConfig>("server");
		const clientAppConfig = this.configService.get<TClientAppConfig>("clientApp");
		const databaseConfig = this.configService.get<TDatabaseConfig>("database");
		const loggerConfig = this.configService.get<TLoggerConfig>("logger");
		const redisConfig = this.configService.get<TRedisConfig>("redis");
		const mailerConfig = this.configService.get<TMailerConfig>("mailer");
		const rateLimiterConfig = this.configService.get<TRateLimiterConfig>("rateLimiter");

		return {
			appConfig,
			serverConfig,
			clientAppConfig,
			databaseConfig,
			loggerConfig,
			redisConfig,
			mailerConfig,
			rateLimiterConfig,
		};
	}
}
