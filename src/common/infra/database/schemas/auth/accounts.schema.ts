import { boolean, foreignKey, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { AccountStatus, AuthProviders, EAccountStatus } from "../../database.type";
import { id } from "../_shared/id";
import { createdAt, updatedAt } from "../_shared/timestamps";
import { usersTable } from "./users.schema";

export const authProvidersEnum = pgEnum("auth_providers", AuthProviders);
export const accountStatusEnum = pgEnum("account_status", AccountStatus);

export const accountsTable = pgTable(
	"accounts",
	{
		id,
		userId: uuid("user_id").notNull(),
		provider: authProvidersEnum("provider").notNull(),
		providerOAuthId: varchar("provider_account_id", { length: 255 }),
		hashedPassword: varchar("hashed_password", { length: 255 }),
		twoFAEnabled: boolean("two_fa_enabled").notNull().default(false),
		twoFASecret: varchar("two_fa_secret", { length: 255 }),
		twoFAConfirmedAt: timestamp("two_fa_confirmed_at", { withTimezone: true }),
		status: accountStatusEnum("status").notNull().default(EAccountStatus.ACTIVE),
		createdAt,
		updatedAt,
	},
	(t) => [
		foreignKey({
			name: "accounts_user_id_fk",
			columns: [t.userId],
			foreignColumns: [usersTable.id],
		}),
	],
);
