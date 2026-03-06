export interface ICreateRegistrationInput {
	email: string;
	tokenHash: string;
	expiresAt: Date;
}

export interface ICreateRegistrationOutput {
	expiresAt: Date;
	lastSentAt: Date;
	sentCount: number;
}

export abstract class RegistrationsAuthPort {
	abstract findByEmail(email: string, tx?: unknown): Promise<ICreateRegistrationOutput | null>;
	abstract create(input: ICreateRegistrationInput, tx?: unknown): Promise<{ tokenHash: string }>;
	abstract resetByEmail(input: ICreateRegistrationInput, tx?: unknown): Promise<void>;
	abstract rotateByEmail(input: Omit<ICreateRegistrationInput, "expiresAt">, tx?: unknown): Promise<void>;
	abstract findByTokenHash(tokenHash: string, tx?: unknown): Promise<{ id: string; email: string } | null>;
	abstract deleteById(id: string, tx?: unknown): Promise<void>;
}
