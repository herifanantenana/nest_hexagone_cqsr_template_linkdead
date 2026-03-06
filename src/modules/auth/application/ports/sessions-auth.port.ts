export interface ICreateInput {
	userId: string;
	accountId: string;
	actorId: string;
	refreshTokenHash: string;
	userAgent: string;
	ipAddress: string;
	deviceId: string;
	expiresAt: Date;
}

export abstract class SessionsAuthPort {
	abstract create(input: ICreateInput, tx?: unknown): Promise<{ id: string }>;
}
