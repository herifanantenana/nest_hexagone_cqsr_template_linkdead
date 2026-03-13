import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { domainsTable } from "@apk_infra/database/schemas/taxonomies/domains.schema";
import { DomainReadPort, IDomainItem } from "@apk_modules/taxonomy/application/ports/domain-read.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DomainReadDrizzleAdapter implements DomainReadPort {
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
				})
				.from(domainsTable);
			return rows;
		});
		return result;
	}
}
