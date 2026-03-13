export interface IAccessTokenPayload {
	userId: string;
	accountId: string;
	actorId: string;
	sessionId: string;
}

export abstract class TokenizerPort {
	abstract generateRefreshToken(deviceId: string): Promise<{ value: string; expiresAt: Date }>;
	abstract generateAccessToken(payload: IAccessTokenPayload): Promise<{ value: string; expiresAt: Date }>;
}
