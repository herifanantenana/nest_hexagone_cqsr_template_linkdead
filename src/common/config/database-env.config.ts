import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IDatabaseConfig {
	DATABASE_USERNAME: string;
	DATABASE_PASSWORD: string;
	DATABASE_HOST: string;
	DATABASE_PORT: number;
	DATABASE_NAME: string;
}

export const databaseEnvConfigValidator = Joi.object({
	DATABASE_USERNAME: Joi.string().required(),
	DATABASE_PASSWORD: Joi.string().required(),
	DATABASE_HOST: Joi.string().required(),
	DATABASE_PORT: Joi.number().port().default(5432),
	DATABASE_NAME: Joi.string().required(),
});

export default registerAs("database", () => {
	const res = databaseEnvConfigValidator.validate(process.env, {
		allowUnknown: true,
		abortEarly: false,
		convert: true,
	});

	if (res.error) {
		throw new Error(`Database environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IDatabaseConfig;

	return {
		user: config.DATABASE_USERNAME,
		password: config.DATABASE_PASSWORD,
		host: config.DATABASE_HOST,
		port: config.DATABASE_PORT,
		name: config.DATABASE_NAME,
	};
});
