import { registerAs } from "@nestjs/config";
import Joi from "joi";

interface IMailerConfig {
	MAILER_FROM: string;
	MAILER_HOST: string;
	MAILER_PORT: number;
	MAILER_USER: string;
	MAILER_PASSWORD: string;
	MAILER_TEMPLATE_DIR: string;
}

export const mailerEnvConfigValidator = Joi.object({
	MAILER_FROM: Joi.string().required(),
	MAILER_HOST: Joi.string().hostname().required(),
	MAILER_USER: Joi.string().email().required(),
	MAILER_PASSWORD: Joi.string().required(),
	MAILER_TEMPLATE_DIR: Joi.string().required(),
});

export default registerAs("mailer", () => {
	const res = mailerEnvConfigValidator.validate(process.env, { allowUnknown: true, abortEarly: false, convert: true });

	if (res.error) {
		throw new Error(`Mailer environment configuration validation error: ${res.error.message}`);
	}

	const config = res.value as IMailerConfig;
	return {
		from: config.MAILER_FROM,
		host: config.MAILER_HOST,
		user: config.MAILER_USER,
		password: config.MAILER_PASSWORD,
		templateDir: config.MAILER_TEMPLATE_DIR,
	};
});
