import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IAuthEnvConfig {
	AUTH_REGISTRATION_COOLDOWN_SEC: number;
	AUTH_REGISTRATION_MAX_ATTEMPTS: number;
	AUTH_REGISTRATION_TOKEN_DB_TTL_SEC: number;
	AUTH_REGISTRATION_TOKEN_SECRET: string;
}

export const authEnvConfigValidator = Joi.object({
	AUTH_REGISTRATION_COOLDOWN_SEC: Joi.number().integer().positive().default(300), // 5 minutes
	AUTH_REGISTRATION_MAX_ATTEMPTS: Joi.number().integer().positive().default(3),
	AUTH_REGISTRATION_TOKEN_DB_TTL_SEC: Joi.number().integer().positive().default(1800), // 30 minutes
	AUTH_REGISTRATION_TOKEN_SECRET: Joi.string().min(32).required(),
});

export default registerAs("auth", () => {
	const res = authEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`Auth environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IAuthEnvConfig;

	return {
		registrationCooldownSec: config.AUTH_REGISTRATION_COOLDOWN_SEC,
		registrationMaxAttempts: config.AUTH_REGISTRATION_MAX_ATTEMPTS,
		registrationTokenDbTtlSec: config.AUTH_REGISTRATION_TOKEN_DB_TTL_SEC,
		registrationTokenSecret: config.AUTH_REGISTRATION_TOKEN_SECRET,
	};
});
