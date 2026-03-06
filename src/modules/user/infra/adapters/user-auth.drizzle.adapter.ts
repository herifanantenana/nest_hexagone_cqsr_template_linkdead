import { DrizzleAdapter } from "@apk_common/infra/database/drizzle.adapter";
import { usersTable } from "@apk_common/infra/database/schemas/auth/users.schema";
import { ICreateInput, UsersAuthPort } from "@apk_modules/auth/application/ports/users-auth.port";
import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

@Injectable()
export class UserAuthDrizzleAdapter implements UsersAuthPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async findIdByEmail(email: string, tx?: unknown): Promise<{ id: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const rows = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
		return rows[0] ?? null;
	}

	async create(
		input: ICreateInput,
		tx?: unknown,
	): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const [row] = await db
			.insert(usersTable)
			.values({
				email: input.email,
				firstName: input.firstName,
				lastName: input.lastName,
			})
			.returning({
				id: usersTable.id,
				email: usersTable.email,
				firstName: usersTable.firstName,
				lastName: usersTable.lastName,
			});
		return row;
	}
}
