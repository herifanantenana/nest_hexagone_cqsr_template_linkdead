import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IThrottlerConfig {
	THROTTLE_REGISTER_TTL_SECONDS: number;
	THROTTLE_REGISTER_LIMIT: number;
}

export const throttlerEnvConfigValidator = Joi.object({
	THROTTLE_REGISTER_TTL_SECONDS: Joi.number().positive().default(300),
	THROTTLE_REGISTER_LIMIT: Joi.number().positive().default(5),
});

export default registerAs("throttler", () => {
	const res = throttlerEnvConfigValidator.validate(process.env, {
		allowUnknown: true,
		abortEarly: false,
		convert: true,
	});

	if (res.error) {
		throw new Error(`Throttler environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IThrottlerConfig;
	return {
		registerLimit: config.THROTTLE_REGISTER_LIMIT,
		registerTtlSeconds: config.THROTTLE_REGISTER_TTL_SECONDS,
	};
});
