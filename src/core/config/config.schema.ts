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
		host: string;
		port: number;
		trustProxy: boolean;
		allowedCorsOrigins: string[];
		apiPathPrefix: string;
		docsPathPrefix: string;
	};

	client: {
		registrationVerificationPath: string;
	};

	logger: {
		engine: string;
		level: string;
		dir: string;
		activeLogFiles: boolean;
		logstashEnabled: boolean;
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

	auth: {
		registration: {
			tokenTtlSec: number;
			verificationLinkTtlSec: number;
			maxAttempts: number;
		};
	};

	jwt: {
		accessTokenKey: string;
		refreshTokenKey: string;
		accessTokenTtlSec: number;
		refreshTokenTtlSec: number;
	};
};

const yamlSchema = Joi.object<TYamlConfig>({
	app: Joi.object({
		name: Joi.string().required(),
		version: Joi.string().required(),
	}).required(),

	server: Joi.object({
		host: Joi.string().required(),
		port: Joi.number().port().required(),
		trustProxy: Joi.boolean().required(),
		allowedCorsOrigins: Joi.array().items(Joi.string().uri()).required(),
		apiPathPrefix: Joi.string().required(),
		docsPathPrefix: Joi.string().required(),
	}).required(),

	client: Joi.object({
		registrationVerificationPath: Joi.string().required(),
	}).required(),

	logger: Joi.object({
		engine: Joi.string().required(),
		level: Joi.string().required(),
		dir: Joi.string().required(),
		activeLogFiles: Joi.boolean().required(),
		logstashEnabled: Joi.boolean().required(),
	}).required(),

	database: Joi.object({
		engine: Joi.string().required(),
	}).required(),

	redis: Joi.object({
		engine: Joi.string().required(),
		appDb: Joi.number().integer().min(0).required(),
		appKeyPrefix: Joi.string().required(),
		jobsDb: Joi.number().integer().min(0).required(),
		jobsKeyPrefix: Joi.string().required(),
	}).required(),

	mailer: Joi.object({
		engine: Joi.string().required(),
		host: Joi.string().required(),
		fromSupport: Joi.string().email().required(),
		fromNoReply: Joi.string().email().required(),
		templatesDir: Joi.string().required(),
	}).required(),

	auth: Joi.object({
		registration: Joi.object({
			tokenTtlSec: Joi.number().integer().min(1).required(),
			verificationLinkTtlSec: Joi.number().integer().min(1).required(),
			maxAttempts: Joi.number().integer().min(1).required(),
		}).required(),
	}).required(),

	jwt: Joi.object({
		accessTokenKey: Joi.string().required(),
		refreshTokenKey: Joi.string().required(),
		accessTokenTtlSec: Joi.number().integer().min(1).required(),
		refreshTokenTtlSec: Joi.number().integer().min(1).required(),
	}).required(),
});

const envSchema = Joi.object({
	NODE_ENV: Joi.string().valid("development", "production").required(),
	APP_RUNTIME: Joi.string().valid("dev", "prod", "docker").required(),

	PUBLIC_CLIENT_APP_URL: Joi.string().uri().required(),
	PUBLIC_SERVER_APP_URL: Joi.string().uri().required(),

	DATABASE_HOST: Joi.string().required(),
	DATABASE_PORT: Joi.number().port().required(),
	DATABASE_NAME: Joi.string().required(),
	DATABASE_USERNAME: Joi.string().required(),
	DATABASE_PASSWORD: Joi.string().required(),

	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().port().required(),

	MAILER_USER: Joi.string().email().required(),
	MAILER_PASSWORD: Joi.string().required(),

	REGISTRATION_TOKEN_SECRET: Joi.string().required(),

	ACCESS_TOKEN_SECRET: Joi.string().required(),
	REFRESH_TOKEN_SECRET: Joi.string().required(),

	LOGSTASH_HOST: Joi.string(),
	LOGSTASH_PORT: Joi.number().port(),
});

function validateEnv(): void {
	const { error } = envSchema.validate(process.env, { allowUnknown: true, abortEarly: false });
	if (error) {
		throw new Error(`Environment validation failed: ${error.message}`);
	}
}

export function parseUrl(url: string) {
	const parsed = new URL(url);
	return {
		protocol: parsed.protocol.replace(":", ""),
		host: parsed.hostname,
		port: parsed.port ? parseInt(parsed.port) : parsed.protocol === "https:" ? 443 : 80,
		url: parsed.origin,
	};
}

let cachedYamlConfig: TYamlConfig | null = null;
export function loadYamlConfig(): TYamlConfig {
	if (cachedYamlConfig) return cachedYamlConfig;

	validateEnv();
	const runTime = process.env.APP_RUNTIME;
	const configFileName = `config.${runTime}.yaml`;
	const configFilePath = path.resolve(__dirname, "files", configFileName);

	if (!fs.existsSync(configFilePath)) {
		throw new Error(`Configuration file not found: ${configFilePath}`);
	}

	const parsed = yaml.load(fs.readFileSync(configFilePath, "utf8")) as TYamlConfig;

	const { error } = yamlSchema.validate(parsed, { abortEarly: false, allowUnknown: false });

	if (error) {
		throw new Error(`YAML configuration validation failed: ${error.message}`);
	}

	cachedYamlConfig = parsed;
	return parsed;
}
