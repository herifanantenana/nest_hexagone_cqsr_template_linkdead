import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module";
import { HandlebarsTemplateAdapter } from "./handlebars-template.adapter";
import { MailerService } from "./mailer.service";
import { NodemailerAdapter } from "./nodemailer.adapter";

@Module({
	imports: [LoggerModule],
	providers: [HandlebarsTemplateAdapter, NodemailerAdapter, MailerService],
	exports: [MailerService],
})
export class MailerModule {}
