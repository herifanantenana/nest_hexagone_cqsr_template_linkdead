import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { domainsTable } from "@apk_infra/database/schemas/taxonomies/domains.schema";
import { DomainsRepoPort, IDomainItem } from "@apk_modules/taxonomy/application/ports/domains-repo.port";
import { Injectable } from "@nestjs/common";
import { asc } from "drizzle-orm";

@Injectable()
export class DomainsRepoDrizzleAdapter implements DomainsRepoPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async listDomains(): Promise<IDomainItem[]> {
		const db = this.drizzleAdapter.getDb();
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db
				.select({
					id: domainsTable.id,
					name: domainsTable.name,
					slug: domainsTable.slug,
				})
				.from(domainsTable)
				.orderBy(asc(domainsTable.name));
			return rows;
		});
		return result;
	}
}
