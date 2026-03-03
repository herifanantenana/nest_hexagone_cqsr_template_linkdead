import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IRedisConfig {
	REDIS_HOST: string;
	REDIS_PORT: number;
	REDIS_APP_PREFIX: string;
	REDIS_JOB_PREFIX: string;
	REDIS_APP_DB: number;
	REDIS_JOB_DB: number;
	REDIS_PENDING_REGISTER_TTL_SECONDS: number;
}

export const redisEnvConfigValidator = Joi.object({
	REDIS_HOST: Joi.string().hostname().required(),
	REDIS_PORT: Joi.number().port().required(),
	REDIS_APP_PREFIX: Joi.string().default("linkdead_v3_app"),
	REDIS_JOB_PREFIX: Joi.string().default("linkdead_v3_jobs"),
	REDIS_APP_DB: Joi.number().integer().min(0).default(0),
	REDIS_JOB_DB: Joi.number().integer().min(0).default(1),
	REDIS_PENDING_REGISTER_TTL_SECONDS: Joi.number().positive().default(3600),
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
		jobPrefix: config.REDIS_JOB_PREFIX,
		appDb: config.REDIS_APP_DB,
		jobDb: config.REDIS_JOB_DB,
		pendingRegisterTtlSeconds: config.REDIS_PENDING_REGISTER_TTL_SECONDS,
	};
});
