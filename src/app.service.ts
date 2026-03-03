import { MailerService } from "@apk_common/infra/mailer/mailer.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
	constructor(private readonly mailerService: MailerService) {}
	async getHello() {
		await this.mailerService.sendTestEmail();
		return "Hello World!";
	}
}
