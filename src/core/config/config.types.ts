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
} from "./root.config";

export type TAppConfig = ReturnType<typeof appConfig>;
export type TServerConfig = ReturnType<typeof serverConfig>;
export type TClientConfig = ReturnType<typeof clientConfig>;
export type TLoggerConfig = ReturnType<typeof loggerConfig>;
export type TDatabaseConfig = ReturnType<typeof databaseConfig>;
export type TRedisConfig = ReturnType<typeof redisConfig>;
export type TMailerConfig = ReturnType<typeof mailerConfig>;
export type TAuthConfig = ReturnType<typeof authConfig>;
export type TJwtConfig = ReturnType<typeof jwtConfig>;
