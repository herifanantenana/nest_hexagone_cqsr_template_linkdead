import { foreignKey, index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, updatedAt } from "../_shared/timestamps";
import { domainsTable } from "./domains.schema";

export const categoriesTable = pgTable(
	"categories",
	{
		id,
		name: varchar("name", { length: 50 }).notNull(),
		slug: varchar("slug", { length: 100 }).notNull(),
		domainId: uuid("domain_id").notNull(),
		createdAt,
		updatedAt,
	},
	(t) => [
		foreignKey({
			name: "categories_domain_id_fk",
			columns: [t.domainId],
			foreignColumns: [domainsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),

		index("categories_domain_id_idx").on(t.domainId),
		uniqueIndex("categories_domain_id_slug_uq").on(t.domainId, t.slug),
	],
);
