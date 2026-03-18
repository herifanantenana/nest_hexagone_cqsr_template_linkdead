import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { organizationsTable } from "@apk_infra/database/schemas/organizations/organizations.schema";
import { OrganizationsRepoAuthPort } from "@apk_modules/auth/application/ports/organizations-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

@Injectable()
export class OrganizationRepoAuthDrizzleAdapter implements OrganizationsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async findIdByUser(userId: string, tx?: unknown): Promise<{ id: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		return this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db
				.select({ id: organizationsTable.id })
				.from(organizationsTable)
				.where(eq(organizationsTable.userId, userId))
				.limit(1);
			return rows[0] || null;
		});
	}
}
