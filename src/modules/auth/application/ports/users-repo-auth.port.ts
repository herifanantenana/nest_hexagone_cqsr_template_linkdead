export abstract class UsersRepoAuthPort {
	abstract findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null>;
}
