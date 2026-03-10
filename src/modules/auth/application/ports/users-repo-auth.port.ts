export interface ICreateUsersInput {
	email: string;
	firstName: string;
	lastName: string;
}

export abstract class UsersRepoAuthPort {
	abstract findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null>;
	abstract create(input: ICreateUsersInput, tx?: unknown): Promise<{ id: string }>;
}
