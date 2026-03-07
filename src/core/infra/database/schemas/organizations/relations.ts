import { defineRelationsPart } from "drizzle-orm/relations";
import { actorsTable } from "../authentications/actors.schema";
import { usersTable } from "../authentications/users.schema";
import { organizationsTable } from "./organizations.schema";

export const organizationsRelations = defineRelationsPart({ organizationsTable, usersTable, actorsTable }, (r) => ({
	organizationsTable: {
		// one organization belongs to one user
		user: r.one.usersTable({
			from: r.organizationsTable.userId,
			to: r.usersTable.id,
		}),

		// one organization has one actor
		actor: r.one.actorsTable({
			from: r.organizationsTable.id,
			to: r.actorsTable.organizationId,
		}),
	},
}));
