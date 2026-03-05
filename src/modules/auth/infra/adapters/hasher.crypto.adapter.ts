import { HasherBrutPort } from "@apk_modules/auth/application/ports/hasher-brut.port";
import { Injectable } from "@nestjs/common";
import { createHmac } from "crypto";
@Injectable()
export class HasherBrutCryptoAdapter implements HasherBrutPort {
	async hashCrypto(value: string, secret: string): Promise<string> {
		return Promise.resolve(createHmac("sha256", secret).update(value).digest("hex"));
	}
}
