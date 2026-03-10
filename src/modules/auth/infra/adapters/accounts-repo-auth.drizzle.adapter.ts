import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { accountsTable } from "@apk_infra/database/schemas/authentications/accounts.schema";
import { EAuthProviders } from "@apk_infra/database/schemas/database.type";
import { AccountsRepoAuthPort, ICreateInput } from "@apk_modules/auth/application/ports/accounts-repo-auth.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AccountsRepoDrizzleAdapter implements AccountsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async createLocal(input: ICreateInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const { userId, passwordHash } = input;
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [createdAccount] = await db
				.insert(accountsTable)
				.values({
					userId,
					passwordHash,
					provider: EAuthProviders.LOCAL,
				})
				.returning({ id: accountsTable.id });
			return createdAccount;
		});
		return result;
	}
}
