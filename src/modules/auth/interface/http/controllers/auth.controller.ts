import appEnvConfig from "@apk_common/config/app-env.config";
import {
	CompleteRegisterCommand,
	ICompleteRegisterCommandResult,
} from "@apk_modules/auth/application/commands/complet-register.command";
import {
	IRequestRegisterCommandResult,
	RequestRegisterCommand,
} from "@apk_modules/auth/application/commands/request-register.command";
import {
	IVerifyTokenRegisterCommandResult,
	VerifyTokenRegisterCommand,
} from "@apk_modules/auth/application/commands/verify-token-register.command";
import { Body, Controller, Inject, Post, Req, Res } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { CompleteRegisterDto } from "../dtos/complete-register.dto";
import { RegisterRequestDto } from "../dtos/request-register.dto";
import { VerifyTokenRegisterRequestDto } from "../dtos/verify-token-register.dto";

@Controller("auth")
export class AuthController {
	constructor(
		private readonly commandBus: CommandBus,
		@Inject(appEnvConfig.KEY) private readonly appConfig: ConfigType<typeof appEnvConfig>,
	) {}

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

	@Post("register/complete")
	@ApiOperation({ summary: "Complete user registration" })
	@ApiBody({ type: CompleteRegisterDto })
	async completeRegister(
		@Body() body: CompleteRegisterDto,
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	) {
		const { token, firstName, lastName, password } = body;
		const ipAddress = request.ip || request.get("x-forwarded-for")?.[0] || "unknown";
		const userAgent = request.get("user-agent") || "unknown";
		const result: ICompleteRegisterCommandResult = await this.commandBus.execute(
			new CompleteRegisterCommand(token, firstName, lastName, password, userAgent, ipAddress),
		);

		// setup the cookie options
		const cookieOptions = {
			httpOnly: true,
			secure: this.appConfig.isProduction,
			sameSite: "lax" as const,
		};

		// set the refresh token cookie
		response.cookie("refreshToken", result.refreshToken, {
			...cookieOptions,
			maxAge: result.refreshTokenExpiresAt.getTime() - Date.now(),
		});
		response.cookie("accessToken", result.accessToken, {
			...cookieOptions,
			maxAge: result.accessTokenExpiresAt.getTime() - Date.now(),
		});

		return "Registration successful";
	}
}
