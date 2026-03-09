export abstract class HasherTokenPort {
	abstract hashFormSecret(value: string, secret: string): string;
	abstract generateRandomToken(length?: number): string;
}
