import { EActorTypes } from "@apk_infra/database/schemas/database.type";

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
	userAgent: string;
	ipAddress: string;
	deviceId: string;
	expiresAt: Date;
	revokedAt: Date | null;
	actor: {
		id: string;
		type: EActorTypes;
		organizationId?: string | null;
	};
}
export interface IRotateRefreshTokenInput {
	sessionId: string;
	oldRefreshTokenHash: string;
	newRefreshTokenHash: string;
	newExpiresAt: Date;
}

export abstract class SessionsRepoAuthPort {
	abstract create(input: ICreateSessionsInput, tx?: unknown): Promise<{ id: string }>;
	abstract findById(sessionId: string, tx?: unknown): Promise<ISessionDbData | null>;
	abstract findByRefreshTokenHash(refreshTokenHash: string, tx?: unknown): Promise<ISessionDbData | null>;
	abstract revokeById(sessionId: string, tx?: unknown): Promise<void>;
	/**
	 * Atomically rotates the refresh token hash.
	 * Returns false when the old hash doesn't match anymore (replay/race).
	 */
	abstract rotateRefreshToken(input: IRotateRefreshTokenInput, tx?: unknown): Promise<boolean>;
}
