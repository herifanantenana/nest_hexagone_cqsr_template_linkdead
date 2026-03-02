import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IAppConfig {
	NODE_ENV: "development" | "production" | "test";
	PORT: number;
	TRUST_PROXY: boolean;
	CROSS_ORIGIN: boolean;
	ALLOWED_ORIGINS: string;
}

export const appEnvConfigValidator = Joi.object({
	NODE_ENV: Joi.string().valid("development", "production", "test").required(),
	PORT: Joi.number().default(3000),
	TRUST_PROXY: Joi.boolean().default(false),
	CROSS_ORIGIN: Joi.boolean().default(false),
	ALLOWED_ORIGINS: Joi.string().default("*"),
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
		port: config.PORT,
		trustProxy: config.TRUST_PROXY,
		crossOrigin: config.CROSS_ORIGIN,
		allowedOrigins: config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
	};
});
