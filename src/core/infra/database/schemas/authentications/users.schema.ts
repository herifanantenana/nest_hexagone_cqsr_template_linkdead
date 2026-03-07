import { jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, deletedAt, updatedAt } from "../_shared/timestamps";

export const usersTable = pgTable("users", {
	id,
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	username: varchar("username", { length: 50 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	bio: text("bio"),
	avatarUrl: varchar("avatar_url", { length: 255 }),
	websiteUrl: varchar("website_url", { length: 255 }),
	location: varchar("location", { length: 100 }),
	preferences: jsonb("preferences").notNull().default({}),
	metadata: jsonb("metadata").notNull().default({}),
	createdAt,
	updatedAt,
	deletedAt,
});
