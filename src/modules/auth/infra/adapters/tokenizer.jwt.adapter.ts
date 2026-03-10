import { jwtConfig } from "@apk_core/config";
import { type TJwtConfig } from "@apk_core/config/root.config";
import { IAccessTokenPayload, TokenizerPort } from "@apk_modules/auth/application/ports/tokenizer.port";
import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "crypto";

@Injectable()
export class TokenizerJwtAdapter implements TokenizerPort {
	constructor(
		@Inject(jwtConfig.KEY) private readonly jwtCfg: TJwtConfig,
		private readonly jwtService: JwtService,
	) {}

	async generateRefreshToken(deviceId: string): Promise<{ value: string; expiresAt: Date }> {
		const expiresAt = new Date(Date.now() + this.jwtCfg.refreshTokenTtlSec * 1000);
		const randomPart = randomBytes(48).toString("hex");
		const token = `${deviceId}.${randomPart}`;
		return Promise.resolve({ value: token, expiresAt });
	}

	async generateAccessToken(payload: IAccessTokenPayload): Promise<{ value: string; expiresAt: Date }> {
		const { userId, accountId, actorId, sessionId } = payload;
		const expiresAt = new Date(Date.now() + this.jwtCfg.accessTokenTtlSec * 1000);
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
