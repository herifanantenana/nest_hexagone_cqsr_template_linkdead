import { RateLimiter } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.decorator";
import { POLICY_AUTH_REGISTER } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.policies";
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@RateLimiter(POLICY_AUTH_REGISTER)
	@Get()
	getHello() {
		return this.appService.getHello();
	}
}
