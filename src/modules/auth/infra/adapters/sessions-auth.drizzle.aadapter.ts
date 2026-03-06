import { DrizzleAdapter } from "@apk_common/infra/database/drizzle.adapter";
import { sessionsTable } from "@apk_common/infra/database/schemas/auth/sessions.schema";
import { ICreateInput, SessionsAuthPort } from "@apk_modules/auth/application/ports/sessions-auth.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SessionsAuthDrizzleAdapter implements SessionsAuthPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async create(input: ICreateInput, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const [row] = await db.insert(sessionsTable).values(input).returning({ id: sessionsTable.id });
		return row;
	}
}
