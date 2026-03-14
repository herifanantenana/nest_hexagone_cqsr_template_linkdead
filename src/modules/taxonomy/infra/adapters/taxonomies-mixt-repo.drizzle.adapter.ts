import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { categoriesTable } from "@apk_infra/database/schemas/taxonomies/categories.schema";
import { categoriesSkillsTable } from "@apk_infra/database/schemas/taxonomies/categoriesSkills.schema";
import { domainsTable } from "@apk_infra/database/schemas/taxonomies/domains.schema";
import { domainsSkillsTable } from "@apk_infra/database/schemas/taxonomies/domainsSkills.schema";
import { skillsTable } from "@apk_infra/database/schemas/taxonomies/skills.schema";
import { IDomainItem } from "@apk_modules/taxonomy/application/ports/domains-repo.port";
import {
	ICategoryDomainItem,
	IDomainTaxonomies,
	TaxonomiesMixtRepoPort,
} from "@apk_modules/taxonomy/application/ports/taxonomies-mixt-repo.port";
import { Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";

@Injectable()
export class TaxonomiesMixtRepoDrizzleAdapter implements TaxonomiesMixtRepoPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async getDomainTaxonomies(domainId: string): Promise<IDomainTaxonomies> {
		const db = this.drizzleAdapter.getDb();
		return await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [domain]: IDomainItem[] = await db
				.select({ id: domainsTable.id, name: domainsTable.name, slug: domainsTable.slug })
				.from(domainsTable)
				.where(eq(domainsTable.id, domainId));

			if (!domain) {
				throw new NotFoundException(`Domain not found in database`);
			}

			const categories: ICategoryDomainItem[] = await db
				.select({
					id: categoriesTable.id,
					name: categoriesTable.name,
					slug: categoriesTable.slug,
					domainId: categoriesTable.domainId,
				})
				.from(categoriesTable)
				.where(eq(categoriesTable.domainId, domainId))
				.orderBy(asc(categoriesTable.name));

			const domainsSkills = await db
				.select({
					domainId: domainsSkillsTable.domainId,
					id: skillsTable.id,
					name: skillsTable.name,
					slug: skillsTable.slug,
					type: skillsTable.type,
					isGlobal: skillsTable.isGlobal,
				})
				.from(domainsSkillsTable)
				.innerJoin(skillsTable, eq(domainsSkillsTable.skillId, skillsTable.id))
				.innerJoin(domainsTable, eq(domainsSkillsTable.domainId, domainsTable.id))
				.where(eq(domainsSkillsTable.domainId, domainId))
				.orderBy(asc(skillsTable.name));

			const categoriesSkills = await db
				.select({
					categoryId: categoriesTable.id,
					id: skillsTable.id,
					name: skillsTable.name,
					slug: skillsTable.slug,
					type: skillsTable.type,
					isGlobal: skillsTable.isGlobal,
				})
				.from(categoriesSkillsTable)
				.innerJoin(categoriesTable, eq(categoriesSkillsTable.categoryId, categoriesTable.id))
				.innerJoin(skillsTable, eq(categoriesSkillsTable.skillId, skillsTable.id))
				.where(eq(categoriesTable.domainId, domain.id))
				.orderBy(asc(skillsTable.name));

			return {
				domain,
				categories,
				domainsSkills,
				categoriesSkills,
			};
		});
	}
}
