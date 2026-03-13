export abstract class EncryptionDecryptionPort {
	abstract hashFromSecret(value: string, secret: string): string;
	abstract encryptFromSecret<T>(value: T, secret: string): string;
	abstract decryptFromSecret<T>(token: string, secret: string): T | null;
	abstract generateRandomToken(length?: number): string;
}
