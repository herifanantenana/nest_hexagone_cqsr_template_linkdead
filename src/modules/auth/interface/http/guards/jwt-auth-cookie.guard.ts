import { jwtConfig } from "@apk_core/config";
import type { TJwtConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { ExecutionContext, Inject, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from "./auth.decorators";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt-cookie") implements OnModuleInit {
	constructor(
		private readonly logger: AppLogger,
		private readonly reflector: Reflector,
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
	) {
		super();
		this.logger = this.logger.withContext(JwtAuthGuard.name);
	}

	onModuleInit(): void {
		this.logger.log(`${JwtAuthGuard.name} established`);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// check if public route
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) return true;

		const request = context.switchToHttp().getRequest<Request>();
		// check if optional auth route, if cookies exist, validate them, if not, allow access without auth context
		const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		const token = (request.cookies as Record<string, unknown>)?.[this.jwtCfg.accessTokenKey];
		if (isOptionalAuth && token == undefined) {
			return true;
		}

		// check if access token exists in cookies, if not, deny access
		if (!isOptionalAuth && token == undefined) {
			throw new UnauthorizedException("Access token is missing in cookies");
		}

		return (await super.canActivate(context)) as boolean;
	}

	handleRequest<TReqAuthContext = any>(
		err: Error | null,
		user: TReqAuthContext | null,
		info: { name?: string; message?: string } | null,
		context: ExecutionContext,
	): TReqAuthContext {
		const request = context.switchToHttp().getRequest<Request>();

		if (err || info || !user) {
			const errorMessage =
				info?.name === "TokenExpiredError"
					? "Access token has expired"
					: info?.name === "JsonWebTokenError"
						? "Invalid access token"
						: (err?.message ?? info?.message ?? "Unauthorized");
			throw new UnauthorizedException(errorMessage);
		}

		// Assign user to request.auth only if it matches the expected shape
		request.auth = user as unknown as {
			userId: string;
			accountId: string;
			actorId: string;
			sessionId: string;
		};

		// Remove user property from request if exists
		request.user = undefined;
		return user;
	}
}
