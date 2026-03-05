import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IRedisConfig {
	REDIS_HOST: string;
	REDIS_PORT: number;
	REDIS_APP_DB: number;
	REDIS_APP_PREFIX: string;
	REDIS_JOBS_DB: number;
	REDIS_JOBS_PREFIX: string;
}

export const redisEnvConfigValidator = Joi.object({
	REDIS_HOST: Joi.string().hostname().required(),
	REDIS_PORT: Joi.number().port().required(),
	REDIS_APP_PREFIX: Joi.string().default("app"),
	REDIS_JOBS_PREFIX: Joi.string().default("jobs"),
	REDIS_APP_DB: Joi.number().integer().min(0).default(0),
	REDIS_JOBS_DB: Joi.number().integer().min(0).default(1),
});

export default registerAs("redis", () => {
	const res = redisEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`Redis environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IRedisConfig;
	return {
		host: config.REDIS_HOST,
		port: config.REDIS_PORT,
		appPrefix: config.REDIS_APP_PREFIX,
		jobsPrefix: config.REDIS_JOBS_PREFIX,
		appDb: config.REDIS_APP_DB,
		jobsDb: config.REDIS_JOBS_DB,
	};
});
