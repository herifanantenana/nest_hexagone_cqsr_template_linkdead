export interface ICreateRegistrationInput {
	email: string;
	hashedToken: string;
	expiresAt: Date;
}

export interface ICreateRegistrationOutput {
	expiresAt: Date;
	lastSentAt: Date;
	sentCount: number;
}

export abstract class RegistrationsAuthPort {
	abstract findHashedTokenExpireAtByEmail(email: string, tx?: unknown): Promise<ICreateRegistrationOutput | null>;
	abstract createRegistration(input: ICreateRegistrationInput, tx?: unknown): Promise<{ hashedToken: string }>;
	abstract resetRegistrationByEmail(input: ICreateRegistrationInput, tx?: unknown): Promise<void>;
	abstract updateCounterRegistrationByEmail(
		input: Omit<ICreateRegistrationInput, "expiresAt">,
		tx?: unknown,
	): Promise<void>;
}
