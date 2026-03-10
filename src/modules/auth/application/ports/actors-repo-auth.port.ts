export abstract class ActorsRepoAuthPort {
	abstract create(userId: string, tx?: unknown): Promise<{ id: string }>;
}
