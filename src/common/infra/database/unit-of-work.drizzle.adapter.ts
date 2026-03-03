import { IUnitOfWorkPort } from "@apk_shared/ports/unit-of-work.port";
import { Injectable } from "@nestjs/common";
import { DrizzleEngineService } from "./drizzle.engine";

@Injectable()
export class DrizzleUnitOfWorkAdapter implements IUnitOfWorkPort {
	constructor(private readonly drizzleEngineService: DrizzleEngineService) {}

	async withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
		return this.drizzleEngineService.getDb().transaction(async (tx) => {
			return fn(tx);
		});
	}
}
