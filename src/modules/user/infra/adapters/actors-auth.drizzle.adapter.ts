import { EActorTypes } from "@apk_common/infra/database/database.type";
import { DrizzleAdapter } from "@apk_common/infra/database/drizzle.adapter";
import { actorsTable } from "@apk_common/infra/database/schemas/auth/actors.schema";
import { ActorsAuthPort } from "@apk_modules/auth/application/ports/actors-auth.port";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ActorsAuthDrizzleAdapter implements ActorsAuthPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async create(userId: string, tx?: unknown): Promise<{ id: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const [row] = await db
			.insert(actorsTable)
			.values({ userId, type: EActorTypes.USER })
			.returning({ id: actorsTable.id });
		return row;
	}
}
