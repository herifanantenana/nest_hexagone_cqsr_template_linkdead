export abstract class TokenHasherPort {
	abstract hashFromSecret(value: string, secret: string): Promise<string>;
	abstract generateRandomToken(length?: number): string;
}
