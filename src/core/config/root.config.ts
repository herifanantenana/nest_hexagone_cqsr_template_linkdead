import { registerAs } from "@nestjs/config";
import { loadYamlConfig, parseUrl } from "./config.schema";

export const appConfig = registerAs("app", () => {
	const { app } = loadYamlConfig();
	const runTime = process.env.APP_RUNTIME ?? "dev";

	return {
		...app,
		runtime: runTime,
		isDev: runTime === "dev",
		isProd: runTime === "prod",
		isDocker: runTime === "docker",
		nodeEnv: process.env.NODE_ENV,
	};
});

export const serverConfig = registerAs("server", () => {
	const { server } = loadYamlConfig();
	return {
		...server,
		publicServerAppUrl: process.env.PUBLIC_SERVER_APP_URL as string,
	};
});

export const clientConfig = registerAs("client", () => {
	const { client } = loadYamlConfig();
	const publicClientAppUrl = process.env.PUBLIC_CLIENT_APP_URL as string;
	const { protocol, host, port } = parseUrl(publicClientAppUrl);
	return {
		protocol,
		host,
		port,
		publicClientAppUrl,
		...client,
	};
});

export const loggerConfig = registerAs("logger", () => {
	const { logger } = loadYamlConfig();
	return {
		...logger,
		logstashHost: process.env.LOGSTASH_HOST as string,
		logstashPort: parseInt(process.env.LOGSTASH_PORT as string),
	};
});

export const databaseConfig = registerAs("database", () => {
	const { database } = loadYamlConfig();
	return {
		...database,
		host: process.env.DATABASE_HOST as string,
		port: parseInt(process.env.DATABASE_PORT as string),
		name: process.env.DATABASE_NAME as string,
		username: process.env.DATABASE_USERNAME as string,
		password: process.env.DATABASE_PASSWORD as string,
	};
});

export const redisConfig = registerAs("redis", () => {
	const { redis } = loadYamlConfig();
	return {
		...redis,
		host: process.env.REDIS_HOST as string,
		port: parseInt(process.env.REDIS_PORT as string),
	};
});

export const mailerConfig = registerAs("mailer", () => {
	const { mailer } = loadYamlConfig();
	return {
		...mailer,
		user: process.env.MAILER_USER as string,
		password: process.env.MAILER_PASSWORD as string,
	};
});

export const authConfig = registerAs("auth", () => {
	const { auth } = loadYamlConfig();
	return {
		...auth,
		registrationTokenSecret: process.env.REGISTRATION_TOKEN_SECRET as string,
	};
});

export const jwtConfig = registerAs("jwt", () => {
	const { jwt } = loadYamlConfig();
	return {
		...jwt,
		accessTokenKey: process.env.ACCESS_TOKEN_SECRET as string,
		refreshTokenKey: process.env.REFRESH_TOKEN_SECRET as string,
	};
});
