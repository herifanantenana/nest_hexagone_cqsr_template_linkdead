import appEnvConfig from "@apk_common/config/app-env.config";
import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import { AppLogger } from "../logger/logger.service";

@Injectable()
export class NodemailerAdapter implements OnModuleInit {
	private transporter: Transporter;
	private readonly logger: AppLogger;

	constructor(
		private readonly appLogger: AppLogger,
		@Inject(mailerEnvConfig.KEY) private readonly mailerConfig: ConfigType<typeof mailerEnvConfig>,
		@Inject(appEnvConfig.KEY) private readonly appConfig: ConfigType<typeof appEnvConfig>,
	) {
		this.logger = this.appLogger.withContext(NodemailerAdapter.name);
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
			throw new Error(`Nodemailer initialization failed: ${error}`);
		}
	}

	public getTransporter() {
		if (!this.transporter) {
			throw new Error("Nodemailer transporter is not initialized");
		}
		return this.transporter;
	}
}
