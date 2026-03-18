import type { TAppConfig, TMailerConfig } from "@apk_core/config/config.types";
import { appConfig, mailerConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class NodemailerAdapter implements OnModuleInit {
	private transporter: Transporter;

	constructor(
		private readonly logger: AppLogger,
		@Inject(mailerConfig.KEY) private readonly mailerCfg: TMailerConfig,
		@Inject(appConfig.KEY) private readonly appCfg: TAppConfig,
	) {
		this.logger = this.logger.withContext(this.mailerCfg.engine);
		this.createTransporter();
	}

	onModuleInit() {
		this.logger.log(`${this.constructor.name} transporter established`);
	}

	private createTransporter() {
		const { host, user, password } = this.mailerCfg;
		try {
			this.transporter = nodemailer.createTransport({
				host,
				port: this.appCfg.isDev ? 587 : 465,
				secure: !this.appCfg.isDev,
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
