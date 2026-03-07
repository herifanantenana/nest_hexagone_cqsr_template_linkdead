import { Module } from "@nestjs/common";
import { HandlebarsTemplateAdapter } from "./adapters/handlebars-template.adapter";
import { NodemailerAdapter } from "./adapters/nodemailer.adapter";
import { MailerService } from "./mailer.service";

@Module({
	imports: [],
	providers: [HandlebarsTemplateAdapter, NodemailerAdapter, MailerService],
	exports: [MailerService],
})
export class MailerModule {}
