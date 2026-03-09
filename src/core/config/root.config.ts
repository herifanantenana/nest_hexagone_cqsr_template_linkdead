import { ConfigType, registerAs } from "@nestjs/config";
import fs from "fs";
import Joi from "joi";
import yaml from "js-yaml";
import os from "os";
import path from "path";

type TYamlConfig = {
	app: {
		name: string;
		version: string;
		// env: "development" | "production";
	};

	server: {
		host: string;
		port: number;
		trustProxy: boolean;
		allowedCorsOrigins: string[];
		apiPathPrefix: string;
		docsPathPrefix: string;
	};

	logger: {
		engine: string;
		level: "error" | "warn" | "info" | "debug" | "verbose";
		dir: string;
		activeLogFiles: boolean;
	};

	database: {
		engine: string;
		// host: string;
		// port: number;
		// name: string;
		// user: string;
		// password: string;
	};

	redis: {
		engine: string;
		// host: string;
		// port: number;
		appDb: number;
		appKeyPrefix: string;
		jobsDb: number;
		jobsKeyPrefix: string;
	};

	mailer: {
		engine: string;
		host: string;
		fromSupport: string;
		fromNoReply: string;
		templatesDir: string;
	};

	rateLimiter: {
		engine: string;
		registerRequest: {
			limit: number;
			ttlSec: number;
		};
	};
};

const yamlSchema = Joi.object({
	app: Joi.object({
		name: Joi.string().required(),
		version: Joi.string().required(),
	}).required(),

	server: Joi.object({
		host: Joi.string().hostname().required(),
		port: Joi.number().required(),
		trustProxy: Joi.boolean().required(),
		allowedCorsOrigins: Joi.array().items(Joi.string()).required(),
		apiPathPrefix: Joi.string().required(),
		docsPathPrefix: Joi.string().required(),
	}).required(),

	logger: Joi.object({
		engine: Joi.string().required(),
		level: Joi.string().valid("error", "warn", "info", "debug", "verbose").required(),
		dir: Joi.string().required(),
		activeLogFiles: Joi.boolean().required(),
	}).required(),

	database: Joi.object({
		engine: Joi.string().required(),
	}).required(),

	redis: Joi.object({
		engine: Joi.string().required(),
		appDb: Joi.number().min(0).required(),
		appKeyPrefix: Joi.string().required(),
		jobsDb: Joi.number().min(0).required(),
		jobsKeyPrefix: Joi.string().required(),
	}).required(),

	mailer: Joi.object({
		engine: Joi.string().required(),
		host: Joi.string().hostname().required(),
		fromSupport: Joi.string().required(),
		fromNoReply: Joi.string().required(),
		templatesDir: Joi.string().required(),
	}).required(),

	rateLimiter: Joi.object({
		engine: Joi.string().required(),
		registerRequest: Joi.object({
			limit: Joi.number().min(1).required(),
			ttlSec: Joi.number().min(1).required(),
		}).required(),
	}).required(),
}).required();

let cachedConfig: TYamlConfig | null = null;

const envSchema = Joi.object({
	NODE_ENV: Joi.string().valid("development", "production").required(),

	CLIENT_APP_PROTOCOL: Joi.string().valid("http", "https"),
	CLIENT_APP_HOST: Joi.string().hostname(),
	CLIENT_APP_PORT: Joi.number().port(),

	DATABASE_HOST: Joi.string().hostname().required(),
	DATABASE_PORT: Joi.number().port().required(),
	DATABASE_NAME: Joi.string().required(),
	DATABASE_USERNAME: Joi.string().required(),
	DATABASE_PASSWORD: Joi.string().required(),

	REDIS_HOST: Joi.string().hostname().required(),
	REDIS_PORT: Joi.number().port().required(),

	MAILER_USER: Joi.string().email().required(),
	MAILER_PASSWORD: Joi.string().required(),
});

function validateEnv() {
	const { error } = envSchema.validate(process.env, { abortEarly: false, allowUnknown: true });
	if (error) {
		throw new Error(`Invalid environment variables: ${error.message}`);
	}
}

function getLocalIp(fallback: string): string {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]!) {
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return fallback;
}

function loadConfig(): TYamlConfig {
	if (cachedConfig) {
		return cachedConfig;
	}

	validateEnv();

	const modeEnv = process.env.NODE_ENV === "production" ? "prod" : "dev";
	const fileName = `config.${modeEnv}.yaml`;
	const filePath = path.join(__dirname, "files", fileName);

	if (!fs.existsSync(filePath)) {
		throw new Error(`Config file not found: ${filePath}`);
	}

	const parsed = yaml.load(fs.readFileSync(filePath, "utf-8")) as TYamlConfig;

	const { error } = yamlSchema.validate(parsed, { abortEarly: false, allowUnknown: true });
	if (error) {
		throw new Error(`Invalid config file: ${error.message}`);
	}

	cachedConfig = parsed;
	return cachedConfig;
}

export const appConfig = registerAs("app", () => {
	const config = loadConfig();
	return {
		name: config.app.name,
		version: config.app.version,
		isProd: process.env.NODE_ENV === "production",
		isDev: process.env.NODE_ENV === "development",
	};
});
export type TAppConfig = ConfigType<typeof appConfig>;

export const clientAppConfig = registerAs("clientApp", () => {
	const ip = process.env.CLIENT_APP_HOST ?? getLocalIp("localhost");
	return {
		protocol: process.env.CLIENT_APP_PROTOCOL || "http",
		host: ip,
		port: Number(process.env.CLIENT_APP_PORT) || 5173,
		clientAppUrl: `${process.env.CLIENT_APP_PROTOCOL || "http"}://${ip}:${Number(process.env.CLIENT_APP_PORT) || 5173}`,
	};
});

export const serverConfig = registerAs("server", () => {
	const config = loadConfig();
	return {
		host: config.server.host,
		port: config.server.port,
		trustProxy: config.server.trustProxy,
		allowedCorsOrigins: config.server.allowedCorsOrigins,
		apiPathPrefix: config.server.apiPathPrefix,
		docsPathPrefix: config.server.docsPathPrefix,
	};
});
export type TServerConfig = ConfigType<typeof serverConfig>;

export const loggerConfig = registerAs("logger", () => {
	const config = loadConfig();
	return config.logger;
});
export type TLoggerConfig = ConfigType<typeof loggerConfig>;

export const databaseConfig = registerAs("database", () => {
	const config = loadConfig();
	return {
		engine: config.database.engine,
		host: process.env.DATABASE_HOST,
		port: Number(process.env.DATABASE_PORT),
		name: process.env.DATABASE_NAME,
		user: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
	};
});
export type TDatabaseConfig = ConfigType<typeof databaseConfig>;

export const redisConfig = registerAs("redis", () => {
	const config = loadConfig();
	return {
		engine: config.redis.engine,
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
		appDb: config.redis.appDb,
		appKeyPrefix: config.redis.appKeyPrefix,
		jobsDb: config.redis.jobsDb,
		jobsKeyPrefix: config.redis.jobsKeyPrefix,
	};
});
export type TRedisConfig = ConfigType<typeof redisConfig>;

export const mailerConfig = registerAs("mailer", () => {
	const config = loadConfig();
	return {
		engine: config.mailer.engine,
		host: config.mailer.host,
		user: process.env.MAILER_USER,
		password: process.env.MAILER_PASSWORD,
		fromSupport: config.mailer.fromSupport,
		fromNoReply: config.mailer.fromNoReply,
		templateDir: config.mailer.templatesDir,
	};
});
export type TMailerConfig = ConfigType<typeof mailerConfig>;

export const rateLimiterConfig = registerAs("rateLimiter", () => {
	const config = loadConfig();
	return {
		engine: config.rateLimiter.engine,
		registerRequest: {
			limit: config.rateLimiter.registerRequest.limit,
			ttlSec: config.rateLimiter.registerRequest.ttlSec,
		},
	};
});
export type TRateLimiterConfig = ConfigType<typeof rateLimiterConfig>;
