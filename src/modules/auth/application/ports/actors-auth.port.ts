export abstract class ActorsAuthPort {
	abstract create(userId: string, tx?: unknown): Promise<{ id: string }>;
}
