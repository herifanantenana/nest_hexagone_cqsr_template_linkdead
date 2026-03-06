import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IAuthEnvConfig {
	AUTH_REGISTRATION_TOKEN_CLD_SEC: number;
	AUTH_REGISTRATION_MAX_ATTEMPTS: number;
	AUTH_REGISTRATION_TOKEN_TTL_SEC: number;
	AUTH_REGISTRATION_TOKEN_SECRET: string;
	// ! not safe
	AUTH_FRONT_VERIFICATION_PATH: string;
	AUTH_FRONT_PORT: number;
}

export const authEnvConfigValidator = Joi.object({
	AUTH_REGISTRATION_TOKEN_CLD_SEC: Joi.number().integer().positive().default(300),
	AUTH_REGISTRATION_MAX_ATTEMPTS: Joi.number().integer().positive().default(3),
	AUTH_REGISTRATION_TOKEN_TTL_SEC: Joi.number().integer().positive().default(900),
	AUTH_REGISTRATION_TOKEN_SECRET: Joi.string().min(32).required(),
	// ! not safe
	AUTH_FRONT_VERIFICATION_PATH: Joi.string().required(),
	AUTH_FRONT_PORT: Joi.number().integer().positive().default(3000),
});

export default registerAs("auth", () => {
	const res = authEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`Auth environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IAuthEnvConfig;

	return {
		registrationCooldownSec: config.AUTH_REGISTRATION_TOKEN_CLD_SEC,
		registrationMaxAttempts: config.AUTH_REGISTRATION_MAX_ATTEMPTS,
		registrationTokenTtlSec: config.AUTH_REGISTRATION_TOKEN_TTL_SEC,
		registrationTokenSecret: config.AUTH_REGISTRATION_TOKEN_SECRET,
		// ! not safe
		frontendBasePath: config.AUTH_FRONT_VERIFICATION_PATH,
		frontendPort: config.AUTH_FRONT_PORT,
	};
});
