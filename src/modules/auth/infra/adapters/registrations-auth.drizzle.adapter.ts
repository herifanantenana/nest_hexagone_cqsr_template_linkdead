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

	async findHashedTokenExpireAtByEmail(email: string, tx?: unknown): Promise<ICreateRegistrationOutput | null> {
		const db = this.drizzleAdapter.getDb(tx);
		const rows = await db
			.select({
				id: registrationsTable.id,
				hashedToken: registrationsTable.hashedToken,
				expiresAt: registrationsTable.expiresAt,
				lastSentAt: registrationsTable.lastSentAt,
				sentCount: registrationsTable.sentCount,
			})
			.from(registrationsTable)
			.where(eq(registrationsTable.email, email));
		return rows[0] ?? null;
	}

	async createRegistration(input: ICreateRegistrationInput, tx?: unknown): Promise<{ hashedToken: string }> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, hashedToken, expiresAt } = input;
		const [row] = await db
			.insert(registrationsTable)
			.values({
				email,
				hashedToken,
				expiresAt,
			})
			.returning({
				hashedToken: registrationsTable.hashedToken,
			});
		return row;
	}

	async resetRegistrationByEmail(input: ICreateRegistrationInput, tx?: unknown): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, hashedToken, expiresAt } = input;
		await db
			.update(registrationsTable)
			.set({
				hashedToken,
				expiresAt,
				lastSentAt: new Date(),
				sentCount: 1,
			})
			.where(eq(registrationsTable.email, email));
	}

	async updateCounterRegistrationByEmail(
		input: Omit<ICreateRegistrationInput, "expiresAt">,
		tx?: unknown,
	): Promise<void> {
		const db = this.drizzleAdapter.getDb(tx);
		const { email, hashedToken } = input;
		await db
			.update(registrationsTable)
			.set({
				hashedToken,
				lastSentAt: new Date(),
				sentCount: sql`${registrationsTable.sentCount} + 1`,
			})
			.where(eq(registrationsTable.email, email));
	}
}
