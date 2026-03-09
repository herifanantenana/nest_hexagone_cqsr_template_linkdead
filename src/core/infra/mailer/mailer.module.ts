import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module";
import { HandlebarsTemplateAdapter } from "./adapters/handlebars-template.adapter";
import { NodemailerAdapter } from "./adapters/nodemailer.adapter";
import { MailerSafeAction } from "./mailer-safe-action";
import { MailerService } from "./mailer.service";

@Module({
	imports: [LoggerModule],
	providers: [HandlebarsTemplateAdapter, NodemailerAdapter, MailerService, MailerSafeAction],
	exports: [MailerService, MailerSafeAction],
})
export class MailerModule {}
