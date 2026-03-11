import { RateLimiter } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.decorator";
import { POLICY_AUTH_REGISTER } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.policies";
import { AccountId, ActorId, Auth, SessionId, UserId } from "@apk_modules/auth/interface/http/guards/auth.decorators";
import { type TReqAuthContext } from "@apk_modules/auth/types/auth.types";
import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@RateLimiter(POLICY_AUTH_REGISTER)
	@Get()
	getHello(
		@Auth() auth: TReqAuthContext,
		@UserId() userId: string,
		@ActorId() actorId: string,
		@AccountId() accountId: string,
		@SessionId() sessionId: string,
	) {
		console.log("Auth context:", auth);
		console.log("User ID:", userId);
		console.log("Actor ID:", actorId);
		console.log("Account ID:", accountId);
		console.log("Session ID:", sessionId);

		return this.appService.getHello();
	}
}
