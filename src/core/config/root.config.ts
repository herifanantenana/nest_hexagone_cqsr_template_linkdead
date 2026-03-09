import { ConfigType, registerAs } from "@nestjs/config";
import fs from "fs";
import Joi from "joi";
import yaml from "js-yaml";
import path from "path";

type TYamlConfig = {
	app: {
		name: string;
		version: string;
	};

	server: {
		port: number;
		trustProxy: boolean;
		allowedCorsOrigins: string[];
		apiPathPrefix: string;
		docsPathPrefix: string;
	};

	client: {
		registerVerifyEmailPath: string;
	};

	logger: {
		engine: string;
		level: "error" | "warn" | "info" | "debug" | "verbose";
		dir: string;
		activeLogFiles: boolean;
	};

	database: {
		engine: string;
	};

	redis: {
		engine: string;
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
		policies: Array<{
			name: string;
			ttlSec: number;
			limit: number;
		}>;
	};

	auth: {
		registration: {
			tokenTtlSec: number;
			tokenCooldown: {
				ttlSec: number;
				maxAttempts: number;
			};
		};
	};
};

const yamlSchema = Joi.object<TYamlConfig>({
	app: Joi.object({
		name: Joi.string().required(),
		version: Joi.string().required(),
	}).required(),

	server: Joi.object({
		port: Joi.number().port().required(),
		trustProxy: Joi.boolean().required(),
		allowedCorsOrigins: Joi.array().items(Joi.string()).required(),
		apiPathPrefix: Joi.string().required(),
		docsPathPrefix: Joi.string().required(),
	}).required(),

	client: Joi.object({
		registerVerifyEmailPath: Joi.string().required(),
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
		host: Joi.string().required(),
		fromSupport: Joi.string().required(),
		fromNoReply: Joi.string().required(),
		templatesDir: Joi.string().required(),
	}).required(),

	rateLimiter: Joi.object({
		engine: Joi.string().required(),
		policies: Joi.array()
			.items(
				Joi.object({
					name: Joi.string().required(),
					ttlSec: Joi.number().min(1).required(),
					limit: Joi.number().min(1).required(),
				}),
			)
			.min(1)
			.required(),
	}).required(),

	auth: Joi.object({
		registration: Joi.object({
			tokenTtlSec: Joi.number().min(1).required(),
			tokenCooldown: Joi.object({
				ttlSec: Joi.number().min(1).required(),
				maxAttempts: Joi.number().min(1).required(),
			}).required(),
		}).required(),
	}).required(),
});

const envSchema = Joi.object({
	NODE_ENV: Joi.string().valid("development", "production").required(),
	APP_RUNTIME: Joi.string().valid("dev", "docker", "prod").required(),

	CLIENT_APP_URL: Joi.string()
		.uri({ scheme: ["http", "https"] })
		.required(),

	DATABASE_HOST: Joi.string().required(),
	DATABASE_PORT: Joi.number().port().required(),
	DATABASE_NAME: Joi.string().required(),
	DATABASE_USERNAME: Joi.string().required(),
	DATABASE_PASSWORD: Joi.string().required(),

	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().port().required(),

	MAILER_USER: Joi.string().email().required(),
	MAILER_PASSWORD: Joi.string().required(),

	AUTH_REGISTER_TOKEN_SECRET: Joi.string().required(),
});

let cachedConfig: TYamlConfig | null = null;

function validateEnv(): void {
	const { error } = envSchema.validate(process.env, {
		abortEarly: false,
		allowUnknown: true,
	});

	if (error) {
		throw new Error(`Invalid environment variables: ${error.message}`);
	}
}

function parseClientAppUrl(url: string) {
	const parsed = new URL(url);

	return {
		protocol: parsed.protocol.replace(":", ""),
		host: parsed.hostname,
		port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
		url: parsed.origin,
	};
}

function resolveListenHost(runtime: string): string {
	return runtime === "dev" ? "127.0.0.1" : "0.0.0.0";
}

function loadConfig(): TYamlConfig {
	if (cachedConfig) {
		return cachedConfig;
	}

	validateEnv();

	const runtime = process.env.APP_RUNTIME ?? "dev";
	const fileName = `config.${runtime}.yaml`;
	const filePath = path.resolve(__dirname, "files", fileName);

	if (!fs.existsSync(filePath)) {
		throw new Error(`Config file not found: ${filePath}`);
	}

	const parsed = yaml.load(fs.readFileSync(filePath, "utf-8")) as TYamlConfig;

	const { error } = yamlSchema.validate(parsed, {
		abortEarly: false,
		allowUnknown: false,
	});

	if (error) {
		throw new Error(`Invalid config file: ${error.message}`);
	}

	cachedConfig = parsed;
	return cachedConfig;
}

export const appConfig = registerAs("app", () => {
	const config = loadConfig();
	const runtime = process.env.APP_RUNTIME ?? "dev";

	return {
		name: config.app.name,
		version: config.app.version,
		runtime,
		isDev: runtime === "dev",
		isDocker: runtime === "docker",
		isProd: runtime === "prod",
		nodeEnv: process.env.NODE_ENV,
	};
});
export type TAppConfig = ConfigType<typeof appConfig>;

export const serverConfig = registerAs("server", () => {
	const config = loadConfig();
	const runtime = process.env.APP_RUNTIME ?? "dev";

	return {
		listenHost: resolveListenHost(runtime),
		port: config.server.port,
		trustProxy: config.server.trustProxy,
		allowedCorsOrigins: config.server.allowedCorsOrigins,
		apiPathPrefix: config.server.apiPathPrefix,
		docsPathPrefix: config.server.docsPathPrefix,
	};
});
export type TServerConfig = ConfigType<typeof serverConfig>;

export const clientAppConfig = registerAs("clientApp", () => {
	const config = loadConfig();
	const clientAppUrl = process.env.CLIENT_APP_URL as string;
	const parsed = parseClientAppUrl(clientAppUrl);

	return {
		protocol: parsed.protocol,
		host: parsed.host,
		port: Number(parsed.port),
		clientAppUrl: parsed.url,
		registerVerifyEmailPath: config.client.registerVerifyEmailPath,
	};
});
export type TClientAppConfig = ConfigType<typeof clientAppConfig>;

export const loggerConfig = registerAs("logger", () => {
	const config = loadConfig();
	return config.logger;
});
export type TLoggerConfig = ConfigType<typeof loggerConfig>;

export const databaseConfig = registerAs("database", () => {
	const config = loadConfig();

	return {
		engine: config.database.engine,
		host: process.env.DATABASE_HOST as string,
		port: Number(process.env.DATABASE_PORT),
		name: process.env.DATABASE_NAME as string,
		user: process.env.DATABASE_USERNAME as string,
		password: process.env.DATABASE_PASSWORD as string,
	};
});
export type TDatabaseConfig = ConfigType<typeof databaseConfig>;

export const redisConfig = registerAs("redis", () => {
	const config = loadConfig();

	return {
		engine: config.redis.engine,
		host: process.env.REDIS_HOST as string,
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
		user: process.env.MAILER_USER as string,
		password: process.env.MAILER_PASSWORD as string,
		fromSupport: config.mailer.fromSupport,
		fromNoReply: config.mailer.fromNoReply,
		templateDir: config.mailer.templatesDir,
	};
});
export type TMailerConfig = ConfigType<typeof mailerConfig>;

export type TRateLimitPolicy = {
	name: string;
	ttlSec: number;
	limit: number;
};

export const rateLimiterConfig = registerAs("rateLimiter", () => {
	const config = loadConfig();

	return {
		engine: config.rateLimiter.engine,
		policies: config.rateLimiter.policies as TRateLimitPolicy[],
	};
});
export type TRateLimiterConfig = ConfigType<typeof rateLimiterConfig>;

export const authConfig = registerAs("auth", () => {
	const config = loadConfig();

	return {
		registerTokenSecret: process.env.AUTH_REGISTER_TOKEN_SECRET as string,
		registration: config.auth.registration,
	};
});
export type TAuthConfig = ConfigType<typeof authConfig>;
