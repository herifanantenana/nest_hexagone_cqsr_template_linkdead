export interface ICreateInput {
	userId: string;
	passwordHash: string;
}

export abstract class AccountsRepoAuthPort {
	abstract createLocal(input: ICreateInput, tx?: unknown): Promise<{ id: string }>;
}
