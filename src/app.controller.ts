import { THROTTLE_ENABLED_KEY, THROTTLER_REGISTER } from "@apk_common/infra/rate-limit/rate-limit.module";
import { applyDecorators, Controller, Get, SetMetadata } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AppService } from "./app.service";

// ! delete later
const RegisterThrottler = () =>
	applyDecorators(SetMetadata(THROTTLE_ENABLED_KEY + THROTTLER_REGISTER, true), Throttle({ [THROTTLER_REGISTER]: {} }));

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@RegisterThrottler()
	getHello() {
		return this.appService.getHello();
	}
}
