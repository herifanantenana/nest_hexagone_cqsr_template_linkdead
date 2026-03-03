import { defineRelationsPart } from "drizzle-orm/relations";
import { organizationsTable } from "../organizations/organizations.schema";
import { accountsTable } from "./accounts.schema";
import { actorsTable } from "./actors.schema";
import { sessionsTable } from "./sessions.schema";
import { usersTable } from "./users.schema";

export const usersRelations = defineRelationsPart(
	{ usersTable, accountsTable, organizationsTable, actorsTable, sessionsTable },
	(r) => ({
		usersTable: {
			// one user has many accounts
			accounts: r.many.accountsTable({
				from: r.usersTable.id,
				to: r.accountsTable.userId,
			}),

			// one user has one organization
			organization: r.one.organizationsTable({
				from: r.usersTable.id,
				to: r.organizationsTable.userId,
			}),

			// one user has one actor
			actor: r.one.actorsTable({
				from: r.usersTable.id,
				to: r.actorsTable.userId,
			}),

			// one user has many sessions
			sessions: r.many.sessionsTable({
				from: r.usersTable.id,
				to: r.sessionsTable.userId,
			}),
		},
	}),
);

export const accountsRelations = defineRelationsPart({ accountsTable, usersTable, sessionsTable }, (r) => ({
	accountsTable: {
		// one account belongs to one user
		user: r.one.usersTable({
			from: r.accountsTable.userId,
			to: r.usersTable.id,
		}),

		// one account has many sessions
		sessions: r.many.sessionsTable({
			from: r.accountsTable.id,
			to: r.sessionsTable.accountId,
		}),
	},
}));

export const actorsRelations = defineRelationsPart(
	{ actorsTable, usersTable, organizationsTable, sessionsTable },
	(r) => ({
		actorsTable: {
			// one actor belongs to one user
			user: r.one.usersTable({
				from: r.actorsTable.userId,
				to: r.usersTable.id,
				optional: true, // because an actor can be either a user or an organization
			}),

			// one actor belongs to one organization
			organization: r.one.organizationsTable({
				from: r.actorsTable.organizationId,
				to: r.organizationsTable.id,
				optional: true, // because an actor can be either a user or an organization
			}),

			// one actor has many sessions
			sessions: r.many.sessionsTable({
				from: r.actorsTable.id,
				to: r.sessionsTable.actorId,
			}),
		},
	}),
);

export const sessionsRelations = defineRelationsPart(
	{ sessionsTable, accountsTable, usersTable, actorsTable },
	(r) => ({
		sessionsTable: {
			// one session belongs to one account
			account: r.one.accountsTable({
				from: r.sessionsTable.accountId,
				to: r.accountsTable.id,
			}),

			// one session belongs to one user
			user: r.one.usersTable({
				from: r.sessionsTable.userId,
				to: r.usersTable.id,
			}),

			// one session belongs to one actor
			actor: r.one.actorsTable({
				from: r.sessionsTable.actorId,
				to: r.actorsTable.id,
			}),
		},
	}),
);
