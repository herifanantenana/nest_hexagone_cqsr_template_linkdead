import { TokenHasherPort } from "@apk_modules/auth/application/ports/token-hasher.port";
import { Injectable } from "@nestjs/common";
import { createHmac, randomBytes } from "crypto";

@Injectable()
export class TokenHasherCryptoAdapter implements TokenHasherPort {
	async hashFromSecret(value: string, secret: string): Promise<string> {
		return Promise.resolve(createHmac("sha256", secret).update(value).digest("hex"));
	}

	generateRandomToken(length = 32): string {
		return randomBytes(length).toString("hex");
	}
}
