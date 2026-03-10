import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { sessionsTable } from "@apk_infra/database/schemas/authentications/sessions.schema";
import {
	ICreateSessionsInput,
	SessionsRepoAuthPort,
} from "@apk_modules/auth/application/ports/sessions-repo-auth.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SessionsRepoAuthDrizzleAdapter implements SessionsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async create(input: ICreateSessionsInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [row] = await db.insert(sessionsTable).values(input).returning({ id: sessionsTable.id });
			return row;
		});
		return result;
	}
}
