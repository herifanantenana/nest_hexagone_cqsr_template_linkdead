import { ConfigType, registerAs } from "@nestjs/config";
import fs from "fs";
import Joi from "joi";
import yaml from "js-yaml";
import path from "path";

type TRootConfig = {
	app: {
		name: string;
		version: string;
		mode: "development" | "production";
	};

	server: {
		port: number;
		trustProxy: boolean;
		allowedCorsOrigins: string[];
		apiPrefix: string;
		docsPrefix: string;
	};

	logger: {
		level: "error" | "warn" | "info" | "debug" | "verbose";
		dir: string;
		activeFiles: boolean;
	};

	database: {
		type: string;
		host: string;
		port: number;
		username: string;
		password: string;
		database: string;
	};
};

const yamlSchema = Joi.object({
	app: Joi.object({
		name: Joi.string().required(),
		version: Joi.string().required(),
		mode: Joi.string().valid("development", "production").required(),
	}).required(),

	server: Joi.object({
		port: Joi.number().required(),
		trustProxy: Joi.boolean().required(),
		allowedCorsOrigins: Joi.array().items(Joi.string()).required(),
		apiPrefix: Joi.string().required(),
		docsPrefix: Joi.string().required(),
	}).required(),

	logger: Joi.object({
		level: Joi.string().valid("error", "warn", "info", "debug", "verbose").required(),
		dir: Joi.string().required(),
		activeFiles: Joi.boolean().required(),
	}).required(),

	database: Joi.object({
		type: Joi.string().required(),
		host: Joi.string().hostname().required(),
		port: Joi.number().port().required(),
		username: Joi.string().required(),
		password: Joi.string().required(),
		database: Joi.string().required(),
	}).required(),
});

let cachedConfig: TRootConfig | null = null;

const envSchema = Joi.object({
	DATABASE_HOST: Joi.string().hostname().required(),
	DATABASE_PORT: Joi.number().port().required(),
	DATABASE_NAME: Joi.string().required(),
	DATABASE_USERNAME: Joi.string().required(),
	DATABASE_PASSWORD: Joi.string().required(),
});

function validateEnv() {
	const { error } = envSchema.validate(process.env, { abortEarly: false, allowUnknown: true });
	if (error) {
		throw new Error(`Invalid environment variables: ${error.message}`);
	}
}

function loadConfig(): TRootConfig {
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

	const parsed = yaml.load(fs.readFileSync(filePath, "utf-8")) as TRootConfig;

	const { error } = yamlSchema.validate(parsed, { abortEarly: false });
	if (error) {
		throw new Error(`Invalid config file: ${error.message}`);
	}

	cachedConfig = parsed;
	return cachedConfig;
}

export const appConfig = registerAs("app", () => {
	const config = loadConfig();
	return config.app;
});
export type TAppConfig = ConfigType<typeof appConfig>;

export const serverConfig = registerAs("server", () => {
	const config = loadConfig();
	return config.server;
});
export type TServerConfig = ConfigType<typeof serverConfig>;

export const loggerConfig = registerAs("logger", () => {
	const config = loadConfig();
	return config.logger;
});
export type TLoggerConfig = ConfigType<typeof loggerConfig>;

export const databaseConfig = registerAs("database", () => {
	const config = loadConfig();
	return config.database;
});
export type TDatabaseConfig = ConfigType<typeof databaseConfig>;
