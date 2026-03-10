import { AppLogger } from "@apk_infra/logger/logger.service";
import { EncryptionDecryptionPort } from "@apk_modules/auth/application/ports/encryption-decryption.port";
import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

@Injectable()
export class EncryptionDecryptionCryptoAdapter implements EncryptionDecryptionPort {
	private readonly algorithm = "aes-256-gcm";
	private readonly ivLength = 12;
	constructor(private readonly logger: AppLogger) {
		this.logger = this.logger.withContext(EncryptionDecryptionCryptoAdapter.name);
	}

	encryptFromSecret(value: string, secret: string): string {
		const payload = { value };
		return this.encrypt(payload, secret);
	}

	generateRandomToken(length = 32): string {
		return randomBytes(length).toString("base64url");
	}

	decryptFromSecret<T>(token: string, secret: string): T | null {
		try {
			return this.decrypt<T>(token, secret);
		} catch (error) {
			this.logger.warn(`Decryption failed: ${(error as Error).message}`);
			return null;
		}
	}

	private encrypt(payload: object, secret: string): string {
		const iv = randomBytes(this.ivLength);
		const key = Buffer.from(secret, "base64");
		const cipher = createCipheriv(this.algorithm, key, iv);

		const plainText = Buffer.from(JSON.stringify(payload), "utf8");
		const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
		const authTag = cipher.getAuthTag();

		return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");
	}

	private decrypt<T>(token: string, secret: string): T {
		const parts = token.split(".");
		if (parts.length !== 3) {
			return null as T;
		}
		const [ivPart, authTagPart, encryptedPart] = parts;
		const iv = Buffer.from(ivPart, "base64url");
		const authTag = Buffer.from(authTagPart, "base64url");
		const encrypted = Buffer.from(encryptedPart, "base64url");

		const key = Buffer.from(secret, "base64");
		const decipher = createDecipheriv(this.algorithm, key, iv);
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
		return JSON.parse(decrypted.toString("utf8")) as T;
	}
}
