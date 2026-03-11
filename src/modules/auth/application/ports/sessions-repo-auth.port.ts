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

export interface ISessionDbData {
	id: string;
	userId: string;
	accountId: string;
	actorId: string;
	refreshTokenHash: string;
	expiresAt: Date;
	revokedAt: Date | null;
}

export abstract class SessionsRepoAuthPort {
	abstract create(input: ICreateSessionsInput, tx?: unknown): Promise<{ id: string }>;
	abstract findById(sessionId: string): Promise<ISessionDbData | null>;
}
