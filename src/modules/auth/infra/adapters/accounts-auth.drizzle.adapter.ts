import { EAuthProviders } from "@apk_common/infra/database/database.type";
import { DrizzleAdapter } from "@apk_common/infra/database/drizzle.adapter";
import { accountsTable } from "@apk_common/infra/database/schemas/auth/accounts.schema";
import { AccountsAuthPort, ICreateInput } from "@apk_modules/auth/application/ports/accounts-auth.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AccountsAuthDrizzleAdapter implements AccountsAuthPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async create(input: ICreateInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const [row] = await db
			.insert(accountsTable)
			.values({ ...input, provider: EAuthProviders.LOCAL })
			.returning({ id: accountsTable.id });
		return row;
	}
}
