import { IUnitOfWorkPort } from "@apk_shared/ports/unit-of-work.port";
import { Injectable } from "@nestjs/common";
import { DrizzleAdapter } from "./drizzle.adapter";

@Injectable()
export class DrizzleUnitOfWorkAdapter implements IUnitOfWorkPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
		return this.drizzleAdapter.getDb().transaction(async (tx) => {
			return fn(tx);
		});
	}
}
