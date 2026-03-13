import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { skillsTable } from "@apk_infra/database/schemas/taxonomies/skills.schema";
import { ISkillItem, SkillsRepoPort } from "@apk_modules/taxonomy/application/ports/skills-repo.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm/sql/expressions/conditions";

@Injectable()
export class SkillsRepoDrizzleAdapter implements SkillsRepoPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async listGlobalSkills(): Promise<ISkillItem[]> {
		const db = this.drizzleAdapter.getDb();
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db
				.select({
					id: skillsTable.id,
					name: skillsTable.name,
					type: skillsTable.type,
					isGlobal: skillsTable.isGlobal,
				})
				.from(skillsTable)
				.where(eq(skillsTable.isGlobal, true));
			return rows;
		});
		return result;
	}
}
