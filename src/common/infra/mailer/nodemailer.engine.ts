import appEnvConfig from "@apk_common/config/app-env.config";
import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import { AppLogger } from "../logger/logger.service";

@Injectable()
export class NodemailerEngineService implements OnModuleInit {
	private transporter: Transporter;
	private readonly logger: AppLogger;

	constructor(
		private readonly appLogger: AppLogger,
		@Inject(mailerEnvConfig.KEY) private readonly mailerConfig: ConfigType<typeof mailerEnvConfig>,
		@Inject(appEnvConfig.KEY) private readonly appConfig: ConfigType<typeof appEnvConfig>,
	) {
		this.logger = this.appLogger.withContext(NodemailerEngineService.name);
		this.createTransporter();
	}

	onModuleInit() {
		this.logger.log("Nodemailer transporter engine initialized.");
	}

	private createTransporter() {
		const { host, user, password } = this.mailerConfig;
		try {
			this.transporter = nodemailer.createTransport({
				host,
				port: this.appConfig.isProduction ? 465 : 587,
				secure: this.appConfig.isProduction,
				auth: {
					user,
					pass: password,
				},
			});
		} catch (error) {
			this.logger.error(`Failed to initialize Nodemailer transporter: ${error}`);
		}
	}

	public getTransporter() {
		return this.transporter;
	}
}
