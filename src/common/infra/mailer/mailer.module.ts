import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module";
import { HandlebarsAdapter } from "./handlebars.adapter";
import { MailerService } from "./mailer.service";
import { NodemailerAdapter } from "./nodemailer.adapter";

@Module({
	imports: [LoggerModule],
	providers: [HandlebarsAdapter, NodemailerAdapter, MailerService],
	exports: [MailerService],
})
export class MailerModule {}
