export abstract class RedisAuthPort {
	abstract getTokenCoolDownRegister(email: string): Promise<string | null>;

	abstract setTokenCoolDownRegister(email: string, token: string, expiresInSeconds: number): Promise<void>;
}
