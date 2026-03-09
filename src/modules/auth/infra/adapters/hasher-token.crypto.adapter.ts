import { HasherTokenPort } from "@apk_modules/auth/application/ports/hasher-token.port";
import { Injectable } from "@nestjs/common";
import { createHmac, randomBytes } from "crypto";

@Injectable()
export class HasherTokenCryptoAdapter implements HasherTokenPort {
	hashFormSecret(value: string, secret: string): string {
		return createHmac("sha256", secret).update(value).digest("base64url");
	}

	generateRandomToken(length = 32): string {
		return randomBytes(length).toString("base64url");
	}
}
