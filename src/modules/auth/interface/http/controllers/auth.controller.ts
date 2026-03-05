import {
	IRequestRegisterCommandResult,
	RequestRegisterCommand,
} from "@apk_modules/auth/application/commands/request-register.command";
import { Body, Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { RegisterRequestDto } from "../dtos/request-register.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly commandBus: CommandBus) {}

	@Post("register/request")
	@ApiOperation({ summary: "Request a user registration" })
	@ApiBody({ type: RegisterRequestDto })
	async requestRegister(@Body() body: RegisterRequestDto) {
		const { email } = body;
		const result: IRequestRegisterCommandResult = await this.commandBus.execute(new RequestRegisterCommand(email));
		return result;
	}
}
