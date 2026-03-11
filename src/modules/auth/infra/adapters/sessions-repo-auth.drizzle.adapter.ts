import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { sessionsTable } from "@apk_infra/database/schemas/authentications/sessions.schema";
import {
	ICreateSessionsInput,
	ISessionDbData,
	SessionsRepoAuthPort,
} from "@apk_modules/auth/application/ports/sessions-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

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
			const [row] = await db
				.select({
					id: sessionsTable.id,
					userId: sessionsTable.userId,
					accountId: sessionsTable.accountId,
					actorId: sessionsTable.actorId,
					refreshTokenHash: sessionsTable.refreshTokenHash,
					expiresAt: sessionsTable.expiresAt,
					revokedAt: sessionsTable.revokedAt,
				})
				.from(sessionsTable)
				.where(eq(sessionsTable.id, sessionId));
			return row;
		});
		return result;
	}

	async findByRefreshTokenHash(refreshTokenHash: string, tx?: unknown): Promise<ISessionDbData | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [row] = await db
				.select({
					id: sessionsTable.id,
					userId: sessionsTable.userId,
					accountId: sessionsTable.accountId,
					actorId: sessionsTable.actorId,
					refreshTokenHash: sessionsTable.refreshTokenHash,
					expiresAt: sessionsTable.expiresAt,
					revokedAt: sessionsTable.revokedAt,
				})
				.from(sessionsTable)
				.where(eq(sessionsTable.refreshTokenHash, refreshTokenHash));
			return row;
		});
		return result;
	}

	async revokeById(sessionId: string, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			await db.update(sessionsTable).set({ revokedAt: new Date() }).where(eq(sessionsTable.id, sessionId));
		});
	}
}
