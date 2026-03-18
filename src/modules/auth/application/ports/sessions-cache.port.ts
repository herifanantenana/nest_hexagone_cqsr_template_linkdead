import { EActorTypes } from "@apk_infra/database/schemas/database.type";

export interface ISessionCacheData {
	sessionId: string;
	userId: string;
	accountId: string;
	actorId: string;
	refreshTokenHash: string;
	expiresAt: Date;
	contextType: EActorTypes;
	organizationId?: string;
}

export abstract class SessionsCachePort {
	abstract setSession(input: ISessionCacheData): Promise<void>;
	abstract getSession(sessionId: string): Promise<ISessionCacheData | null>;
	abstract deleteSession(sessionId: string): Promise<void>;
}
