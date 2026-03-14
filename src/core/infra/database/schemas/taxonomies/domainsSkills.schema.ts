import { foreignKey, index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "../_shared/timestamps";
import { domainsTable } from "./domains.schema";
import { skillsTable } from "./skills.schema";

export const domainsSkillsTable = pgTable(
	"domains_skills",
	{
		domainId: uuid("domain_id").notNull(),
		skillId: uuid("skill_id").notNull(),
		createdAt,
		updatedAt,
	},
	(t) => [
		primaryKey({ name: "domains_skills_pk", columns: [t.domainId, t.skillId] }),
		foreignKey({
			name: "domains_skills_domain_id_fk",
			columns: [t.domainId],
			foreignColumns: [domainsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "domains_skills_skill_id_fk",
			columns: [t.skillId],
			foreignColumns: [skillsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		index("domains_skills_domain_id_idx").on(t.domainId),
		index("domains_skills_skill_id_idx").on(t.skillId),
	],
);
