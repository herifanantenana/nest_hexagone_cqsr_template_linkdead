import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { actorsTable } from "@apk_infra/database/schemas/authentications/actors.schema";
import { EActorTypes } from "@apk_infra/database/schemas/database.type";
import { ActorsRepoAuthPort } from "@apk_modules/auth/application/ports/actors-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

@Injectable()
export class ActorsRepoAuthDrizzleAdapter implements ActorsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async create(userId: string, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [createdActor] = await db
				.insert(actorsTable)
				.values({
					userId,
					type: EActorTypes.USER,
				})
				.returning({ id: actorsTable.id });
			return createdActor;
		});
		return result;
	}

	async findIdByUserId(userId: string, tx?: unknown): Promise<{ id: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db.select({ id: actorsTable.id }).from(actorsTable).where(eq(actorsTable.userId, userId));
			return rows[0] ?? null;
		});
		return result;
	}
}
