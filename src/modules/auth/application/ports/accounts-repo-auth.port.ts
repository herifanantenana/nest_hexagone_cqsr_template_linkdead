export interface ICreateInput {
	userId: string;
	passwordHash: string;
}
export interface IFindAuthOutput {
	id: string;
	passwordHash: string | null;
	twoFaEnabled: boolean;
}

export abstract class AccountsRepoAuthPort {
	abstract createLocal(input: ICreateInput, tx?: unknown): Promise<{ id: string }>;
	abstract findAuthByUserId(userId: string, tx?: unknown): Promise<IFindAuthOutput | null>;
}
