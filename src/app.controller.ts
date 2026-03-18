import { AppLogger } from "@apk_infra/logger/logger.service";
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private logger: AppLogger,
	) {
		this.logger = this.logger.withContext(AppController.name);
	}

	@Get()
	getHello() {
		return this.appService.getHello();
	}
}
