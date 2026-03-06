import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IJwtConfig {
	JWT_ACCESS_TOKEN_SECRET: string;
	JWT_ACCESS_TOKEN_TTL_SECONDS: number;
	JWT_REFRESH_TOKEN_SECRET: string;
	JWT_REFRESH_TOKEN_TTL_SECONDS: number;
}

export const jwtEnvConfigValidator = Joi.object({
	JWT_ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
	JWT_ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(900),
	JWT_REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
	JWT_REFRESH_TOKEN_TTL_SECONDS: Joi.number().integer().positive().default(604800),
});

export default registerAs("jwt", () => {
	const res = jwtEnvConfigValidator.validate(process.env, {
		allowUnknown: true,
		abortEarly: false,
		convert: true,
	});

	if (res.error) {
		throw new Error(`Jwt environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IJwtConfig;

	return {
		accessTokenSecret: config.JWT_ACCESS_TOKEN_SECRET,
		accessTokenTtlSec: config.JWT_ACCESS_TOKEN_TTL_SECONDS,
		refreshTokenSecret: config.JWT_REFRESH_TOKEN_SECRET,
		refreshTokenTtlSec: config.JWT_REFRESH_TOKEN_TTL_SECONDS,
	};
});
