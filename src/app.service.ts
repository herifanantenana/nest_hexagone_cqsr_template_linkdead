import type {
	TAppConfig,
	TAuthConfig,
	TClientConfig,
	TDatabaseConfig,
	TJwtConfig,
	TLoggerConfig,
	TMailerConfig,
	TRedisConfig,
	TServerConfig,
} from "@apk_core/config/config.types";
import {
	appConfig,
	authConfig,
	clientConfig,
	databaseConfig,
	jwtConfig,
	loggerConfig,
	mailerConfig,
	redisConfig,
	serverConfig,
} from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
	constructor(
		private logger: AppLogger,
		@Inject(appConfig.KEY) private readonly appCfg: TAppConfig,
		@Inject(serverConfig.KEY) private readonly serverCfg: TServerConfig,
		@Inject(clientConfig.KEY) private readonly clientCfg: TClientConfig,
		@Inject(loggerConfig.KEY) private readonly loggerCfg: TLoggerConfig,
		@Inject(databaseConfig.KEY) private readonly databaseCfg: TDatabaseConfig,
		@Inject(redisConfig.KEY) private readonly redisCfg: TRedisConfig,
		@Inject(mailerConfig.KEY) private readonly mailerCfg: TMailerConfig,
		@Inject(authConfig.KEY) private readonly authCfg: TAuthConfig,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
	) {}

	getHello() {
		return {
			appConfig: this.appCfg,
			serverConfig: this.serverCfg,
			clientConfig: this.clientCfg,
			loggerConfig: this.loggerCfg,
			databaseConfig: this.databaseCfg,
			redisConfig: this.redisCfg,
			mailerConfig: this.mailerCfg,
			authConfig: this.authCfg,
			jwtConfig: this.jwtCfg,
		};
	}
}
