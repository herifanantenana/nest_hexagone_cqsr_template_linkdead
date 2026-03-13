export abstract class ActorsRepoAuthPort {
	abstract create(userId: string, tx?: unknown): Promise<{ id: string }>;
	abstract findIdByUserId(userId: string, tx?: unknown): Promise<{ id: string } | null>;
}
