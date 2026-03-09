import { clientAppConfig } from "@apk_core/config";
import { type TClientAppConfig } from "@apk_core/config/root.config";
import { MailerSafeAction } from "@apk_infra/mailer/mailer-safe-action";
import { MailerService } from "@apk_infra/mailer/mailer.service";
import { BoxMailerPort } from "@apk_modules/auth/application/ports/box-mailer.port";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class BoxMailerNodemailerAdapter implements BoxMailerPort {
	constructor(
		@Inject(clientAppConfig.KEY) private readonly clientAppCfg: TClientAppConfig,
		private readonly mailerService: MailerService,
		private readonly mailerSafeAction: MailerSafeAction,
	) {}

	private buildUrlClient(path: string) {
		return `${this.clientAppCfg.clientAppUrl}/${path}`;
	}

	async sendVerificationRegisterEmail(to: string, token: string): Promise<void> {
		const verificationUrl = this.buildUrlClient(`${this.clientAppCfg.registerVerifyEmailPath}?token=${token}`);

		await this.mailerSafeAction.withSafeAsyncOrThrow(
			async () => await this.mailerService.sendVerificationEmail(to, to, verificationUrl),
		);
	}
}
