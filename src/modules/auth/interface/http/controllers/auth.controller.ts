import {
	IRequestRegisterCommandResult,
	RequestRegisterCommand,
} from "@apk_modules/auth/application/commands/request-register.command";
import {
	IVerifyTokenRegisterCommandResult,
	VerifyTokenRegisterCommand,
} from "@apk_modules/auth/application/commands/verify-token-register.command";
import { Body, Controller, Post, Req } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { type Request } from "express";
import { RegisterRequestDto } from "../dtos/request-register.dto";
import { VerifyTokenRegisterRequestDto } from "../dtos/verify-token-register.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post("register/request")
	@ApiOperation({ summary: "Request a user registration" })
	@ApiBody({ type: RegisterRequestDto })
	async requestRegister(@Body() body: RegisterRequestDto, @Req() request: Request) {
		const { email } = body;
		const ip = request.ip!;
		const result: IRequestRegisterCommandResult = await this.commandBus.execute(new RequestRegisterCommand(email, ip));
		return result;
	}

	@Post("register/verify-token")
	@ApiOperation({ summary: "Verify registration token" })
	@ApiBody({ type: VerifyTokenRegisterRequestDto })
	async verifyTokenRegister(@Body() body: VerifyTokenRegisterRequestDto) {
		const { email, token } = body;
		const result: IVerifyTokenRegisterCommandResult = await this.commandBus.execute(
			new VerifyTokenRegisterCommand(email, token),
		);
		return result;
	}
}
