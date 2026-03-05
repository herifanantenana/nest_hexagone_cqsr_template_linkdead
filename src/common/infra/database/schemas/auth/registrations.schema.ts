import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, expiresAt, lastSentAt, updatedAt } from "../_shared/timestamps";

export const registrationsTable = pgTable("registrations", {
	id,
	email: varchar("email", { length: 255 }).notNull().unique(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
	sentCount: integer("sent_count").notNull().default(1),
	lastSentAt,
	expiresAt,
	createdAt,
	updatedAt,
});
