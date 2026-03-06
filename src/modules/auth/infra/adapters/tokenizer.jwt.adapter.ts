import jwtEnvConfig from "@apk_common/config/jwt-env.config";
import { IAccessTokenPayload, TokenizerPort } from "@apk_modules/auth/application/ports/tokenizer.port";
import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config/dist/types/config.type";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { randomBytes } from "crypto";

@Injectable()
export class TokenizerJwtAdapter implements TokenizerPort {
	constructor(
		@Inject(jwtEnvConfig.KEY) private readonly jwtConfig: ConfigType<typeof jwtEnvConfig>,
		private readonly jwtService: JwtService,
	) {}

	async generateRefreshToken(deviceId: string): Promise<{ value: string; expiresAt: Date }> {
		const expiresAt = new Date(Date.now() + this.jwtConfig.refreshTokenTtlSec * 1000);
		const randomPart = randomBytes(48).toString("hex");
		const token = `${deviceId}.${randomPart}`;
		return Promise.resolve({ value: token, expiresAt });
	}

	async generateAccessToken(payload: IAccessTokenPayload): Promise<{ value: string; expiresAt: Date }> {
		const { userId, accountId, actorId, sessionId } = payload;
		const expiresAt = new Date(Date.now() + this.jwtConfig.accessTokenTtlSec * 1000);
		const token = await this.jwtService.signAsync({
			sub: userId,
			uid: userId,
			acid: accountId,
			atid: actorId,
			sid: sessionId,
		});
		return { value: token, expiresAt };
	}
}
