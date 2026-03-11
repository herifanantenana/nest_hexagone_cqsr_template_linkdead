import { foreignKey, index, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { id } from "../_shared/id";
import { createdAt, expiresAt, revokedAt, updatedAt } from "../_shared/timestamps";
import { ESessionStatus, SessionStatus } from "../database.type";
import { accountsTable } from "./accounts.schema";
import { actorsTable } from "./actors.schema";
import { usersTable } from "./users.schema";

export const sessionsStatusEnum = pgEnum("sessions_status", SessionStatus);

export const sessionsTable = pgTable(
	"sessions",
	{
		id,
		accountId: uuid("account_id").notNull(),
		userId: uuid("user_id").notNull(),
		actorId: uuid("actor_id").notNull(),
		refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),
		userAgent: varchar("user_agent", { length: 255 }),
		ipAddress: varchar("ip_address", { length: 45 }),
		deviceId: varchar("device_id", { length: 255 }),
		status: sessionsStatusEnum("status").notNull().default(ESessionStatus.ACTIVE),
		revokedAt,
		expiresAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		foreignKey({
			name: "sessions_account_id_fk",
			columns: [t.accountId],
			foreignColumns: [accountsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "sessions_user_id_fk",
			columns: [t.userId],
			foreignColumns: [usersTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "sessions_actor_id_fk",
			columns: [t.actorId],
			foreignColumns: [actorsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		index("sessions_account_id_idx").on(t.accountId),
		index("sessions_user_id_idx").on(t.userId),
		index("sessions_actor_id_idx").on(t.actorId),
	],
);
