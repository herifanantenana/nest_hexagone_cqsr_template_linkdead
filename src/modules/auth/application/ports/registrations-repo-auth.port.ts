export interface ICreateRegistrationsInput {
	email: string;
	tokenHash: string;
	expiresAt: Date;
}

export interface IRegistrationsFindOutput {
	id: string;
	tokenHash: string;
	email: string;
	expiresAt: Date;
	sentCount: number;
}

export abstract class RegistrationsRepoAuthPort {
	abstract findByEmail(email: string, tx?: unknown): Promise<IRegistrationsFindOutput | null>;
	abstract create(input: ICreateRegistrationsInput, tx?: unknown): Promise<{ tokenHash: string }>;
	abstract resetByEmail(input: ICreateRegistrationsInput, tx?: unknown): Promise<void>;
	abstract rotateByEmail(input: Omit<ICreateRegistrationsInput, "expiresAt">, tx?: unknown): Promise<void>;
	abstract findByTokenHash(tokenHash: string, tx?: unknown): Promise<{ id: string; email: string } | null>;
	abstract deleteById(id: string, tx?: unknown): Promise<void>;
}
