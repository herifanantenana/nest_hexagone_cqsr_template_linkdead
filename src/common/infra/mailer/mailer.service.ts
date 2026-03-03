import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { AppLogger } from "../logger/logger.service";
import { HandlebarsEngineService } from "./handlebars.engine";
import { NodemailerEngineService } from "./nodemailer.engine";

@Injectable()
export class MailerService {
	private readonly logger: AppLogger;

	constructor(
		private readonly nodemailerEngineService: NodemailerEngineService,
		private readonly handlebarsEngineService: HandlebarsEngineService,
		private readonly appLogger: AppLogger,
		@Inject(mailerEnvConfig.KEY) private readonly mailerConfig: ConfigType<typeof mailerEnvConfig>,
	) {
		this.logger = appLogger.withContext(MailerService.name);
	}

	private async sendTemplateEmail(to: string, subject: string, templateName: string, context: Record<string, unknown>) {
		const transporter = this.nodemailerEngineService.getTransporter();
		try {
			const html: string = this.handlebarsEngineService.renderTemplate(templateName, context);
			const info = (await transporter.sendMail({
				from: this.mailerConfig.from,
				to,
				subject,
				html,
			})) as unknown as SMTPTransport.SentMessageInfo;

			const previewUrl = nodemailer.getTestMessageUrl(info);
			if (previewUrl) {
				this.logger.debug(`Email preview URL: ${previewUrl}`);
			}
			this.logger.debug(`Email sent to ${to} with subject "${subject}"`);
		} catch (error) {
			this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
		}
	}

	public async sendTestEmail() {
		await this.sendTemplateEmail("herifanantenana17@gmail.com", "Test Email", "verify-email", {
			username: "Herifananatanana",
			verifyUrl: "https://example.com/verify",
		});
	}
}
