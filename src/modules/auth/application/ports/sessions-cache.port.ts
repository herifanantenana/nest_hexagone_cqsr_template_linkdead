export interface ISessionCacheData {
	sessionId: string;
	userId: string;
	accountId: string;
	actorId: string;
	refreshTokenHash: string;
	expiresAt: Date;
}

export abstract class SessionsCachePort {
	abstract setSession(input: ISessionCacheData): Promise<void>;
	abstract getSession(sessionId: string): Promise<ISessionCacheData | null>;
	abstract deleteSession(sessionId: string): Promise<void>;
	abstract rotateSession(sessionId: string, newRefreshTokenHash: string, newExpiresAt: Date): Promise<void>;
}
