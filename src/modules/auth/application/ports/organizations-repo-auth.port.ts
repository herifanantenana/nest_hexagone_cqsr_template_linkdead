export abstract class OrganizationsRepoAuthPort {
	abstract findIdByUser(userId: string, tx?: unknown): Promise<{ id: string } | null>;
}
