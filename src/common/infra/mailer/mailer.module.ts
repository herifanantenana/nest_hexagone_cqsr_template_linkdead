import { Global, Module } from "@nestjs/common";
import { HandlebarsAdapter } from "./handlebars.adapter";
import { MailerService } from "./mailer.service";
import { NodemailerAdapter } from "./nodemailer.adapter";

@Global()
@Module({
	providers: [HandlebarsAdapter, NodemailerAdapter, MailerService],
	exports: [MailerService],
})
export class MailerModule {}
