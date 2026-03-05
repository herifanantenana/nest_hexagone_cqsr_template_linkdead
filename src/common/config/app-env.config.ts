import { registerAs } from "@nestjs/config";
import Joi from "joi";
import os from "os";

interface IAppConfig {
	NODE_ENV: "development" | "production" | "test";
	APP_NAME: string;
	APP_VERSION: string;
	APP_PORT: number;
	APP_TRUST_PROXY: boolean;
	APP_ALLOWED_ORIGINS: string;
	APP_PATH_PREFIX: string;
	APP_SWAGGER_PATH_PREFIX: string;
}

function getLocalIp(local: string): string {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]!) {
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return local;
}

export const appEnvConfigValidator = Joi.object({
	NODE_ENV: Joi.string().valid("development", "production", "test").required(),
	APP_NAME: Joi.string().default("my-app"),
	APP_VERSION: Joi.string().default("v1"),
	APP_PORT: Joi.number().port().default(3000),
	APP_TRUST_PROXY: Joi.boolean().default(false),
	APP_ALLOWED_ORIGINS: Joi.string().default("*"),
	APP_PATH_PREFIX: Joi.string().default("dev-api"),
	APP_SWAGGER_PATH_PREFIX: Joi.string().default("dev-docs"),
	APP_FRONTEND_BASE_URL: Joi.string().default("http://localhost:3000"),
});

export default registerAs("app", () => {
	const res = appEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`App environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IAppConfig;
	const allowedOrigins = config.APP_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());

	return {
		isDevelopment: config.NODE_ENV === "development",
		isProduction: config.NODE_ENV === "production",
		isTest: config.NODE_ENV === "test",
		name: config.APP_NAME,
		version: config.APP_VERSION,
		host: config.NODE_ENV === "production" ? getLocalIp("127.0.0.1") : "127.0.0.1",
		port: config.APP_PORT,
		trustProxy: config.APP_TRUST_PROXY,
		allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ["*"],
		pathPrefix: config.APP_PATH_PREFIX,
		swaggerPathPrefix: config.APP_SWAGGER_PATH_PREFIX,
	};
});
