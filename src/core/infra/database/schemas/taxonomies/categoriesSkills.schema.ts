import { foreignKey, index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "../_shared/timestamps";
import { categoriesTable } from "./categories.schema";
import { skillsTable } from "./skills.schema";

export const categoriesSkillsTable = pgTable(
	"categories_skills",
	{
		categoryId: uuid("category_id").notNull(),
		skillId: uuid("skill_id").notNull(),
		createdAt,
		updatedAt,
	},
	(t) => [
		primaryKey({
			name: "categories_skills_pk",
			columns: [t.categoryId, t.skillId],
		}),
		foreignKey({
			name: "categories_skills_category_id_fk",
			columns: [t.categoryId],
			foreignColumns: [categoriesTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "categories_skills_skill_id_fk",
			columns: [t.skillId],
			foreignColumns: [skillsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		index("categories_skills_category_id_idx").on(t.categoryId),
		index("categories_skills_skill_id_idx").on(t.skillId),
	],
);
