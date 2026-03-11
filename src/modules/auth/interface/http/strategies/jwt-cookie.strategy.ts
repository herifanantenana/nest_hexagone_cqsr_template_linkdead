import { jwtConfig, type TJwtConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { RequestAuthResolverService } from "@apk_modules/auth/application/services/request-auth-resolver.service";
import { TJwtAuthPayload, TReqAuthContext } from "@apk_modules/auth/types/auth.types";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { type Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

function cookieExtractorFactory(accessTokenKey: string) {
	return (req: Request): string | null => {
		const cookies = req.cookies as Record<string, string> | undefined;
		const token = cookies?.[accessTokenKey];
		return typeof token === "string" ? token : null;
	};
}

@Injectable()
export class JwtCookieStrategy extends PassportStrategy(Strategy, "jwt-cookie") implements OnModuleInit {
	constructor(
		private readonly logger: AppLogger,
		@Inject(jwtConfig.KEY) jwtCfg: TJwtConfig,
		private readonly requestAuthResolverService: RequestAuthResolverService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractorFactory(jwtCfg.accessTokenKey)]),
			secretOrKey: jwtCfg.accessTokenSecret,
			ignoreExpiration: false,
		});
		this.logger = this.logger.withContext(JwtCookieStrategy.name);
	}

	onModuleInit() {
		this.logger.log(`${JwtCookieStrategy.name} initialized`);
	}

	async validate(payload: TJwtAuthPayload): Promise<TReqAuthContext> {
		return this.requestAuthResolverService.resolve(payload);
	}
}
