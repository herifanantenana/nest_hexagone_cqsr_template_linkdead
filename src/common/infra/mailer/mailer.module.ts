import { Global, Module } from "@nestjs/common";
import { HandlebarsEngineService } from "./handlebars.engine";
import { MailerService } from "./mailer.service";
import { NodemailerEngineService } from "./nodemailer.engine";

@Global()
@Module({
	providers: [HandlebarsEngineService, NodemailerEngineService, MailerService],
	exports: [MailerService],
})
export class MailerModule {}
