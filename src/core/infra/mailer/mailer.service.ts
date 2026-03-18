import type { TMailerConfig } from "@apk_core/config/config.types";
import { mailerConfig } from "@apk_core/config/root.config";
import { Inject, Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { AppLogger } from "../logger/logger.service";
import { HandlebarsTemplateAdapter } from "./adapters/handlebars-template.adapter";
import { NodemailerAdapter } from "./adapters/nodemailer.adapter";

@Injectable()
export class MailerService {
	constructor(
		private readonly logger: AppLogger,
		private readonly nodemailerAdapter: NodemailerAdapter,
		private readonly handlebarsAdapter: HandlebarsTemplateAdapter,
		@Inject(mailerConfig.KEY) private readonly mailerCfg: TMailerConfig,
	) {
		this.logger = logger.withContext(MailerService.name);
	}

	private async sendTemplateEmail(templateName: string, subject: string, to: string, context: Record<string, unknown>) {
		const transporter = this.nodemailerAdapter.getTransporter();
		const html: string = this.handlebarsAdapter.renderTemplate(templateName, context);

		try {
			const info = (await transporter.sendMail({
				from: this.mailerCfg.fromSupport,
				to,
				subject,
				html,
			})) as unknown as SMTPTransport.SentMessageInfo;

			const previewUrl = nodemailer.getTestMessageUrl(info);
			if (previewUrl) {
				this.logger.debug(`Email preview URL: ${previewUrl}`);
			}
		} catch (error) {
			this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
			throw error;
		}
	}

	public async sendVerificationEmail(to: string, username: string, verifyUrl: string) {
		await this.sendTemplateEmail("verify-email", "Please verify your email", to, {
			username,
			verifyUrl,
		});
	}
}
