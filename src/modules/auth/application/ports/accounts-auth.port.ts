export interface ICreateInput {
	userId: string;
	passwordHash: string;
}

export abstract class AccountsAuthPort {
	abstract create(input: ICreateInput, tx?: unknown): Promise<{ id: string }>;
}
