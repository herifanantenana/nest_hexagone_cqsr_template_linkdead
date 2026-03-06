import { DrizzleAdapter } from "@apk_common/infra/database/drizzle.adapter";
import { registrationsTable } from "@apk_common/infra/database/schemas/auth/registrations.schema";
import {
	ICreateRegistrationInput,
	ICreateRegistrationOutput,
	RegistrationsAuthPort,
} from "@apk_modules/auth/application/ports/registration-auth.port";
import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";

@Injectable()
export class RegistrationsAuthDrizzleAdapter implements RegistrationsAuthPort {
	constructor(private readonly drizzleAdapter: DrizzleAdapter) {}

	async findByEmail(email: string, tx?: unknown): Promise<ICreateRegistrationOutput | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const rows = await db
			.select({
				id: registrationsTable.id,
				tokenHash: registrationsTable.tokenHash,
				expiresAt: registrationsTable.expiresAt,
				lastSentAt: registrationsTable.lastSentAt,
				sentCount: registrationsTable.sentCount,
			})
			.from(registrationsTable)
			.where(eq(registrationsTable.email, email));
		return rows[0] ?? null;
	}

	async create(input: ICreateRegistrationInput, tx?: unknown): Promise<{ tokenHash: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash, expiresAt } = input;
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
	}

	async resetByEmail(input: ICreateRegistrationInput, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash, expiresAt } = input;
		await db
			.update(registrationsTable)
			.set({
				tokenHash,
				expiresAt,
				lastSentAt: new Date(),
				sentCount: 1,
			})
			.where(eq(registrationsTable.email, email));
	}

	async rotateByEmail(input: Omit<ICreateRegistrationInput, "expiresAt">, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, tokenHash } = input;
		await db
			.update(registrationsTable)
			.set({
				tokenHash,
				lastSentAt: new Date(),
				sentCount: sql`${registrationsTable.sentCount} + 1`,
			})
			.where(eq(registrationsTable.email, email));
	}

	async findByTokenHash(tokenHash: string, tx?: unknown): Promise<{ id: string; email: string } | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const rows = await db
			.select({
				id: registrationsTable.id,
				email: registrationsTable.email,
			})
			.from(registrationsTable)
			.where(eq(registrationsTable.tokenHash, tokenHash));
		return rows[0] ?? null;
	}

	async deleteById(id: string, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		await db.delete(registrationsTable).where(eq(registrationsTable.id, id));
	}
}
