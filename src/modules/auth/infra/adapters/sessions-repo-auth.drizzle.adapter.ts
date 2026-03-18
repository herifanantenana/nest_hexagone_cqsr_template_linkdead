import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { sessionsTable } from "@apk_infra/database/schemas/authentications/sessions.schema";
import {
	ICreateSessionsInput,
	IRotateRefreshTokenInput,
	ISessionDbData,
	SessionsRepoAuthPort,
} from "@apk_modules/auth/application/ports/sessions-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

@Injectable()
export class SessionsRepoAuthDrizzleAdapter implements SessionsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async create(input: ICreateSessionsInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [row] = await db.insert(sessionsTable).values(input).returning({ id: sessionsTable.id });
			return row;
		});
		return result;
	}

	async findById(sessionId: string, tx?: unknown): Promise<ISessionDbData | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const row = await db.query.sessionsTable.findFirst({
				where: { id: sessionId },
				columns: {
					id: true,
					userId: true,
					accountId: true,
					actorId: true,
					refreshTokenHash: true,
					deviceId: true,
					userAgent: true,
					ipAddress: true,
					expiresAt: true,
					revokedAt: true,
				},
				with: {
					actor: {
						columns: {
							id: true,
							type: true,
							organizationId: true,
						},
					},
				},
			});
			return row ?? null;
		});
		return result;
	}

	async findByRefreshTokenHash(refreshTokenHash: string, tx?: unknown): Promise<ISessionDbData | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const row = await db.query.sessionsTable.findFirst({
				where: { refreshTokenHash },
				columns: {
					id: true,
					userId: true,
					accountId: true,
					actorId: true,
					refreshTokenHash: true,
					deviceId: true,
					userAgent: true,
					ipAddress: true,
					expiresAt: true,
					revokedAt: true,
				},
				with: {
					actor: {
						columns: {
							id: true,
							type: true,
							organizationId: true,
						},
					},
				},
			});
			return row ?? null;
		});
		return result;
	}

	async revokeById(sessionId: string, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			await db.update(sessionsTable).set({ revokedAt: new Date() }).where(eq(sessionsTable.id, sessionId));
		});
	}

	async rotateRefreshToken(input: IRotateRefreshTokenInput, tx?: unknown): Promise<boolean> {
		const db = this.drizzleAdapter.getDb(tx);
		const { sessionId, oldRefreshTokenHash, newRefreshTokenHash, newExpiresAt } = input;
		return this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const updated = await db
				.update(sessionsTable)
				.set({ refreshTokenHash: newRefreshTokenHash, expiresAt: newExpiresAt })
				.where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.refreshTokenHash, oldRefreshTokenHash)))
				.returning({ id: sessionsTable.id });
			return updated.length === 1;
		});
	}
}
