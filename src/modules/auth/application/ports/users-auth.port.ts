export abstract class UsersAuthPort {
	abstract findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null>;
}
