export abstract class EncryptionDecryptionPort {
	abstract encryptFromSecret(value: string, secret: string): string;
	abstract decryptFromSecret<T>(token: string, secret: string): T | null;
	abstract generateRandomToken(length?: number): string;
}
