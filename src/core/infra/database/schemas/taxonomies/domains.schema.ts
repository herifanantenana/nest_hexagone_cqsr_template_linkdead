import { pgTable, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, updatedAt } from "../_shared/timestamps";

export const domainsTable = pgTable("domains", {
	id,
	name: varchar("name", { length: 50 }).notNull(),
	slug: varchar("slug", { length: 100 }).unique().notNull(),
	createdAt,
	updatedAt,
});
