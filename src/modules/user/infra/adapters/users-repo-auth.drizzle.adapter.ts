import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { usersTable } from "@apk_infra/database/schemas/authentications/users.schema";
import { ICreateUsersInput, UsersRepoAuthPort } from "@apk_modules/auth/application/ports/users-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm/sql/expressions/conditions";

@Injectable()
export class UsersRepoAuthDrizzleAdapter implements UsersRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
			return rows[0] ?? null;
		});
		return result;
	}

	async create(input: ICreateUsersInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, firstName, lastName } = input;
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [createdUser] = await db
				.insert(usersTable)
				.values({
					email,
					firstName,
					lastName,
				})
				.returning({ id: usersTable.id });
			return createdUser;
		});
		return result;
	}
}
