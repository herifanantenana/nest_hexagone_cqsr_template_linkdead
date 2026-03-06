export interface ICreateInput {
	email: string;
	firstName: string;
	lastName: string;
}

export abstract class UsersAuthPort {
	abstract findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null>;
	abstract create(
		input: ICreateInput,
		tx?: unknown,
	): Promise<{ id: string; email: string; firstName: string; lastName: string }>;
}
