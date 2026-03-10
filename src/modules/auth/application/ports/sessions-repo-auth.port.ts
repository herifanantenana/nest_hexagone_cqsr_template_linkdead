export interface ICreateSessionsInput {
	userId: string;
	accountId: string;
	actorId: string;
	refreshTokenHash: string;
	userAgent: string;
	ipAddress: string;
	deviceId: string;
	expiresAt: Date;
}

export abstract class SessionsRepoAuthPort {
	abstract create(input: ICreateSessionsInput, tx?: unknown): Promise<{ id: string }>;
}
