import { boolean, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, updatedAt } from "../_shared/timestamps";
import { ESkillTypes, SkillTypes } from "../database.type";

export const skillsTypesEnum = pgEnum("skills_types", SkillTypes);

export const skillsTable = pgTable("skills", {
	id,
	name: varchar("name", { length: 50 }).notNull(),
	slug: varchar("slug", { length: 100 }).unique().notNull(),
	type: skillsTypesEnum("type").notNull().default(ESkillTypes.HARD),
	isGlobal: boolean("is_global").notNull().default(false),
	createdAt,
	updatedAt,
});
