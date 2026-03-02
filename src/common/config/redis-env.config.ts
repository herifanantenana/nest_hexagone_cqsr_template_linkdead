import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IRedisConfig {
	REDIS_HOST: string;
	REDIS_PORT: number;
	REDIS_PREFIX: string;
	REDIS_PENDING_REGISTER_TTL_SECONDS: number;
}

export const redisEnvConfigValidator = Joi.object({
	REDIS_HOST: Joi.string().hostname().required(),
	REDIS_PORT: Joi.number().port().required(),
	REDIS_PREFIX: Joi.string().default("linkdead_v3"),
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
		prefix: config.REDIS_PREFIX,
		pendingRegisterTtlSeconds: config.REDIS_PENDING_REGISTER_TTL_SECONDS,
	};
});
