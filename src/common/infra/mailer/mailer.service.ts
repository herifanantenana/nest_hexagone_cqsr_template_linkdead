import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { AppLogger } from "../logger/logger.service";
import { HandlebarsTemplateAdapter } from "./handlebars-template.adapter";
import { NodemailerAdapter } from "./nodemailer.adapter";

@Injectable()
export class MailerService {
	private readonly logger: AppLogger;

	constructor(
		private readonly appLogger: AppLogger,
		private readonly nodemailerAdapter: NodemailerAdapter,
		private readonly handlebarsAdapter: HandlebarsTemplateAdapter,
		@Inject(mailerEnvConfig.KEY) private readonly mailerConfig: ConfigType<typeof mailerEnvConfig>,
	) {
		this.logger = appLogger.withContext(MailerService.name);
	}

	private async sendTemplateEmail(templateName: string, subject: string, to: string, context: Record<string, unknown>) {
		const transporter = this.nodemailerAdapter.getTransporter();
		const html: string = this.handlebarsAdapter.renderTemplate(templateName, context);

		try {
			const info = (await transporter.sendMail({
				from: this.mailerConfig.fromSupport,
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
			throw error;
		}
	}

	public async sendTestEmail() {
		await this.sendTemplateEmail("verify-email", "Test Email", "herifanantenana17@gmail.com", {
			username: "Herifananatanana",
			verifyUrl: "https://example.com/verify",
		});
	}

	// ! not safe
	public async sendVerificationEmail(to: string, username: string, verifyUrl: string) {
		await this.sendTemplateEmail("verify-email", "Please verify your email", to, {
			username,
			verifyUrl,
		});
	}
}
