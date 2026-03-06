export abstract class RegisterCooldownPort {
	abstract isOnCooldown(email: string): Promise<boolean>;
	abstract start(email: string, token: string, ttlSec: number): Promise<void>;
	abstract getCooldownToken(email: string): Promise<string | null>;
	abstract delete(email: string): Promise<void>;
}
