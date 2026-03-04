import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IRateLimitConfig {
	RATE_LIMIT_REGISTER_TTL_SECONDS: number;
	RATE_LIMIT_REGISTER_LIMIT: number;
}

export const rateLimitEnvConfigValidator = Joi.object({
	RATE_LIMIT_REGISTER_TTL_SECONDS: Joi.number().positive().default(300),
	RATE_LIMIT_REGISTER_LIMIT: Joi.number().positive().default(5),
});

export default registerAs("rateLimit", () => {
	const res = rateLimitEnvConfigValidator.validate(process.env, {
		allowUnknown: true,
		abortEarly: false,
		convert: true,
	});

	if (res.error) {
		throw new Error(`Rate limit environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IRateLimitConfig;
	return {
		registerLimit: config.RATE_LIMIT_REGISTER_LIMIT,
		registerTtlSeconds: config.RATE_LIMIT_REGISTER_TTL_SECONDS,
	};
});
