import { RATE_LIMIT_ENABLED_KEY, THROTTLER_REGISTER } from "@apk_common/infra/rate-limit/rate-limit.module";
import { applyDecorators, Controller, Get, Request, SetMetadata } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { type Request as RequestExpress } from "express";
import { AppService } from "./app.service";

// ! delete later
const RegisterThrottler = () =>
	applyDecorators(
		SetMetadata(`${RATE_LIMIT_ENABLED_KEY}:${THROTTLER_REGISTER}`, true),
		Throttle({ [THROTTLER_REGISTER]: {} }),
	);

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@RegisterThrottler()
	getHello(@Request() req: RequestExpress): string {
		console.log("Request received at / with IP:", req.ip);
		return this.appService.getHello();
	}
}
