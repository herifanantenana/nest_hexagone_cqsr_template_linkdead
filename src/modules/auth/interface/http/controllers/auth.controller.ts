import { appConfig, jwtConfig, type TAppConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { NoThrottle, RateLimiter } from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.decorator";
import {
	POLICY_AUTH_LOGIN,
	POLICY_AUTH_REGISTER,
	POLICY_AUTH_REGISTER_VERIFY_TOKEN_EMAIL,
} from "@apk_core/interface/http/guards/rate-limiter/rate-limiter.policies";
import {
	CompleteRegisterCommand,
	ICompleteRegisterCommandResult,
} from "@apk_modules/auth/application/commands/complete-register.command";
import { ILoginCommandResult, LoginCommand } from "@apk_modules/auth/application/commands/login.command";
import {
	IRequestRegisterCommandResult,
	RequestRegisterCommand,
} from "@apk_modules/auth/application/commands/request-register.command";
import {
	IVerifyTokenEmailRegisterCommandResult,
	VerifyTokenEmailRegisterCommand,
} from "@apk_modules/auth/application/commands/verify-token-email-register.command";
import { Body, Controller, Inject, Post, Req, Res } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { CompleteRegisterDto } from "../dtos/complete-register.dto";
import { LoginDto } from "../dtos/login.dto";
import { RequestRegisterDto } from "../dtos/request-register.dto";
import { VerifyTokenEmailRegisterDto } from "../dtos/verify-token-email-register.dto";
import { AuthPublic } from "../guards/auth.decorators";

@Controller("auth")
export class AuthController {
	constructor(
		private readonly commandBus: CommandBus,
		@Inject(appConfig.KEY) private readonly appCfg: TAppConfig,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
	) {}

	@RateLimiter(POLICY_AUTH_REGISTER)
	@AuthPublic()
	@Post("register/request")
	@ApiOperation({ summary: "Request a user registration" })
	@ApiBody({ type: RequestRegisterDto })
	async requestRegister(@Body() body: RequestRegisterDto) {
		const { email } = body;
		const result: IRequestRegisterCommandResult = await this.commandBus.execute(new RequestRegisterCommand(email));
		return result;
	}

	@RateLimiter(POLICY_AUTH_REGISTER_VERIFY_TOKEN_EMAIL)
	@AuthPublic()
	@Post("register/verify-token-email")
	@ApiOperation({ summary: "Confirm the registration token" })
	@ApiBody({ type: VerifyTokenEmailRegisterDto })
	async confirmRegisterToken(@Body() body: VerifyTokenEmailRegisterDto) {
		const { token } = body;
		const result: IVerifyTokenEmailRegisterCommandResult = await this.commandBus.execute(
			new VerifyTokenEmailRegisterCommand(token),
		);
		return result;
	}

	@NoThrottle()
	@AuthPublic()
	@Post("register/complete")
	@ApiOperation({ summary: "Complete the user registration" })
	@ApiBody({ type: CompleteRegisterDto })
	async completeRegister(
		@Body() body: CompleteRegisterDto,
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	) {
		const { token, firstName, lastName, password } = body;
		const ipAddress = request.ip || "unknown";
		const userAgent = request.get("user-agent") || "unknown";
		const result: ICompleteRegisterCommandResult = await this.commandBus.execute(
			new CompleteRegisterCommand(token, firstName, lastName, password, userAgent, ipAddress),
		);

		// setup the cookie options
		const cookieOptions = {
			httpOnly: true,
			secure: this.appCfg.isProd,
			sameSite: "lax" as const,
		};

		// set the refresh token cookie
		response.cookie(this.jwtCfg.refreshTokenKey, result.refreshToken, {
			...cookieOptions,
			maxAge: result.refreshTokenExpiresAt.getTime() - Date.now(),
		});
		response.cookie(this.jwtCfg.accessTokenKey, result.accessToken, {
			...cookieOptions,
			maxAge: result.accessTokenExpiresAt.getTime() - Date.now(),
		});

		return "Registration completed successfully";
	}

	@RateLimiter(POLICY_AUTH_LOGIN)
	@AuthPublic()
	@Post("login")
	@ApiOperation({ summary: "Login a user" })
	@ApiBody({ type: LoginDto })
	async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
		const { email, password } = body;
		const ipAddress = request.ip || "unknown";
		const userAgent = request.get("user-agent") || "unknown";
		const result: ILoginCommandResult = await this.commandBus.execute(
			new LoginCommand(email, password, userAgent, ipAddress),
		);

		// setup the cookie options
		const cookieOptions = {
			httpOnly: true,
			secure: this.appCfg.isProd,
			sameSite: "lax" as const,
		};

		// set the refresh token cookie
		response.cookie(this.jwtCfg.refreshTokenKey, result.refreshToken, {
			...cookieOptions,
			maxAge: result.refreshTokenExpiresAt.getTime() - Date.now(),
		});
		response.cookie(this.jwtCfg.accessTokenKey, result.accessToken, {
			...cookieOptions,
			maxAge: result.accessTokenExpiresAt.getTime() - Date.now(),
		});

		return "Login successful";
	}
}
