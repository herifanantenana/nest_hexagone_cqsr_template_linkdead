export abstract class RegisterCooldownPort {
	abstract isOnEmailCooldown(email: string): Promise<boolean>;
	abstract start(email: string, token: string, ttlSec: number): Promise<void>;
}
