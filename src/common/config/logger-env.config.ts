import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface ILoggerConfig {
	LOGGER_LEVEL: "error" | "warn" | "info" | "debug" | "verbose";
	LOGGER_DIR: string;
	LOGGER_ACTIVE_FILE: boolean;
}

export const loggerEnvConfigValidator = Joi.object({
	LOGGER_LEVEL: Joi.string().valid("error", "warn", "info", "debug", "verbose").default("verbose"),
	LOGGER_DIR: Joi.string().default("./logs"),
	LOGGER_ACTIVE_FILE: Joi.boolean().default(false),
});

export default registerAs("logger", () => {
	const res = loggerEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`Logger environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as ILoggerConfig;
	return {
		level: config.LOGGER_LEVEL,
		dir: config.LOGGER_DIR,
		activeFile: config.LOGGER_ACTIVE_FILE,
	};
});
