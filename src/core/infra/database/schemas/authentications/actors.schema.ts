import { check, foreignKey, pgEnum, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql/sql";
import { id } from "../_shared/id";
import { createdAt } from "../_shared/timestamps";
import { ActorTypes } from "../database.type";
import { organizationsTable } from "../organizations/organizations.schema";
import { usersTable } from "./users.schema";

export const actorsTypesEnum = pgEnum("actors_types", ActorTypes);

export const actorsTable = pgTable(
	"actors",
	{
		id,
		type: actorsTypesEnum("type").notNull(),
		userId: uuid("user_id"),
		organizationId: uuid("organization_id"),
		createdAt,
	},
	(t) => [
		uniqueIndex("actors_user_id_unique").on(t.userId),
		uniqueIndex("actors_organization_id_unique").on(t.organizationId),
		foreignKey({
			name: "actors_user_id_fk",
			columns: [t.userId],
			foreignColumns: [usersTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "actors_organization_id_fk",
			columns: [t.organizationId],
			foreignColumns: [organizationsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		check(
			"only_one_id",
			sql`((user_id IS NOT NULL AND organization_id IS NULL AND type = 'user') OR (user_id IS NULL AND organization_id IS NOT NULL AND type = 'organization'))`,
		),
	],
);
