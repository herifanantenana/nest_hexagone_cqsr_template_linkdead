import { foreignKey, jsonb, pgEnum, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { EOrganizationStatus, EOrganizationTypes, OrganizationStatus, OrganizationTypes } from "../../database.type";
import { id } from "../_shared/id";
import { createdAt, deletedAt, updatedAt } from "../_shared/timestamps";
import { usersTable } from "../auth/users.schema";

export const organizationTypesEnum = pgEnum("organization_types", OrganizationTypes);
export const organizationStatusEnum = pgEnum("organization_status", OrganizationStatus);

export const organizationsTable = pgTable(
	"organizations",
	{
		id,
		userId: uuid("user_id").notNull().unique(),
		name: varchar("name", { length: 50 }).notNull(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		slug: varchar("slug", { length: 255 }).notNull().unique(),
		description: text("description"),
		type: organizationTypesEnum("type").notNull().default(EOrganizationTypes.COMPANY),
		status: organizationStatusEnum("status").notNull().default(EOrganizationStatus.ACTIVE),
		logUrl: varchar("log_url", { length: 255 }),
		websiteUrl: varchar("website_url", { length: 255 }),
		location: varchar("location", { length: 100 }),
		preferences: jsonb("preferences").notNull().default({}),
		metadata: jsonb("metadata").notNull().default({}),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		foreignKey({
			name: "organizations_user_id_fk",
			columns: [t.userId],
			foreignColumns: [usersTable.id],
		}),
	],
);
