export abstract class HasherBrutPort {
	abstract hashCrypto(value: string, secret: string): Promise<string>;
}
