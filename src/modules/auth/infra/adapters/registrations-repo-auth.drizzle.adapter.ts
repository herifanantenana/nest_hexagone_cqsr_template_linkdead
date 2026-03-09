import { DrizzleAdapter } from "@apk_infra/database/adapters/drizzle.adapter";
import { DatabaseSafeAction } from "@apk_infra/database/database-safe-action";
import { registrationsTable } from "@apk_infra/database/schemas/authentications/registrations.schema";
import {
	ICreateRegistrationsInput,
	RegistrationsRepoAuthPort,
} from "@apk_modules/auth/application/ports/registrations-repo-auth.port";
import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";

@Injectable()
export class RegistrationsRepoAuthDrizzleAdapter implements RegistrationsRepoAuthPort {
	constructor(
		private readonly drizzleAdapter: DrizzleAdapter,
		private readonly databaseSafeAction: DatabaseSafeAction,
	) {}

	async findByEmail(email: string, tx?: unknown): Promise<{ expiresAt: Date; sentCount: number } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db
				.select({
					expiresAt: registrationsTable.expiresAt,
					sentCount: registrationsTable.sentCount,
				})
				.from(registrationsTable)
				.where(eq(registrationsTable.email, email));
			return rows[0] ?? null;
		});
		return result;
	}

	async create(input: ICreateRegistrationsInput, tx?: unknown): Promise<{ tokenHash: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash, expiresAt } = input;
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const [row] = await db
				.insert(registrationsTable)
				.values({
					email,
					tokenHash,
					expiresAt,
				})
				.returning({
					tokenHash: registrationsTable.tokenHash,
				});
			return row;
		});
		return result;
	}

	async resetByEmail(input: ICreateRegistrationsInput, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash, expiresAt } = input;
		await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			await db
				.update(registrationsTable)
				.set({
					tokenHash,
					expiresAt,
					lastSentAt: new Date(),
					sentCount: 1,
				})
				.where(eq(registrationsTable.email, email));
		});
	}

	async rotateByEmail(input: Omit<ICreateRegistrationsInput, "expiresAt">, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash } = input;
		await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			await db
				.update(registrationsTable)
				.set({
					tokenHash,
					lastSentAt: new Date(),
					sentCount: sql`${registrationsTable.sentCount} + 1`,
				})
				.where(eq(registrationsTable.email, email));
		});
	}

	async findByTokenHash(tokenHash: string, tx?: unknown): Promise<{ id: string; email: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const result = await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			const rows = await db
				.select({ id: registrationsTable.id, email: registrationsTable.email })
				.from(registrationsTable)
				.where(eq(registrationsTable.tokenHash, tokenHash));
			return rows[0] ?? null;
		});
		return result;
	}

	async deleteById(id: string, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		await this.databaseSafeAction.withSafeAsyncOrThrow(async () => {
			await db.delete(registrationsTable).where(eq(registrationsTable.id, id));
		});
	}
}
