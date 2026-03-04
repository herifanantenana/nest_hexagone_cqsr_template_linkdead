import { registerAs } from "@nestjs/config";
import Joi from "joi";
import os from "os";

interface IAppConfig {
	NODE_ENV: "development" | "production" | "test";
	APP_PORT: number;
	APP_TRUST_PROXY: boolean;
	APP_CROSS_ORIGIN: boolean;
	APP_ALLOWED_ORIGINS: string;
	APP_PREFIX: string;
	APP_SWAGGER_PREFIX: string;
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
	APP_PORT: Joi.number().default(3000),
	APP_TRUST_PROXY: Joi.boolean().default(false),
	APP_CROSS_ORIGIN: Joi.boolean().default(false),
	APP_ALLOWED_ORIGINS: Joi.string().default("*"),
	APP_PREFIX: Joi.string().default("dev-api"),
	APP_SWAGGER_PREFIX: Joi.string().default("dev-docs"),
});

export default registerAs("app", () => {
	const res = appEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`App environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IAppConfig;

	return {
		isDevelopment: config.NODE_ENV === "development",
		isProduction: config.NODE_ENV === "production",
		isTest: config.NODE_ENV === "test",
		host: config.NODE_ENV === "production" ? getLocalIp("127.0.0.1") : "127.0.0.1",
		port: config.APP_PORT,
		trustProxy: config.APP_TRUST_PROXY,
		crossOrigin: config.APP_CROSS_ORIGIN,
		allowedOrigins: config.APP_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
		prefix: config.APP_PREFIX,
		swaggerPrefix: config.APP_SWAGGER_PREFIX,
	};
});
