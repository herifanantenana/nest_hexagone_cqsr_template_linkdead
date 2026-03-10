import { RateLimiter } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.decorator";
import {
	POLICY_AUTH_REGISTER,
	POLICY_AUTH_REGISTER_CONFIRM_TOKEN,
} from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.policies";
import {
	ConfirmTokenRegisterCommand,
	IConfirmTokenRegisterCommandResult,
} from "@apk_modules/auth/application/commands/confirm-token-register.command";
import {
	IRequestRegisterCommandResult,
	RequestRegisterCommand,
} from "@apk_modules/auth/application/commands/request-register.command";
import { Body, Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { VerifyTokenRegisterRequestDto } from "../dtos/confirm-token-register.dto";
import { RegisterRequestDto } from "../dtos/request-register.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly commandBus: CommandBus) {}

	@RateLimiter(POLICY_AUTH_REGISTER)
	@Post("register/request")
	@ApiOperation({ summary: "Request a user registration" })
	@ApiBody({ type: RegisterRequestDto })
	async requestRegister(@Body() body: RegisterRequestDto) {
		const { email } = body;
		const result: IRequestRegisterCommandResult = await this.commandBus.execute(new RequestRegisterCommand(email));
		return result;
	}

	@RateLimiter(POLICY_AUTH_REGISTER_CONFIRM_TOKEN)
	@Post("register/confirm-token")
	@ApiOperation({ summary: "Confirm the registration token" })
	@ApiBody({ type: VerifyTokenRegisterRequestDto })
	async confirmRegisterToken(@Body() body: VerifyTokenRegisterRequestDto) {
		const { token } = body;
		const result: IConfirmTokenRegisterCommandResult = await this.commandBus.execute(
			new ConfirmTokenRegisterCommand(token),
		);
		return result;
	}
}
