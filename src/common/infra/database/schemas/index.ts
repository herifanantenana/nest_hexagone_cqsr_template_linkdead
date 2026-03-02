import { accountsTable, accountStatusEnum, authProvidersEnum } from "./auth/accounts.schema";
import { actorsTable, actorsTypesEnum } from "./auth/actors.schema";
import { accountsRelations, actorsRelations, sessionsRelations, usersRelations } from "./auth/relations";
import { sessionsStatusEnum, sessionsTable } from "./auth/sessions.schema";
import { usersTable } from "./auth/users.schema";
import {
	organizationsTable,
	organizationStatusEnum,
	organizationTypesEnum,
} from "./organizations/organizations.schema";
import { organizationsRelations } from "./organizations/relations";

export const enums = [
	authProvidersEnum,
	accountStatusEnum,
	organizationTypesEnum,
	organizationStatusEnum,
	actorsTypesEnum,
	sessionsStatusEnum,
];

export const schemas = [usersTable, accountsTable, organizationsTable, actorsTable, sessionsTable];

export const relations = [
	usersRelations,
	accountsRelations,
	organizationsRelations,
	actorsRelations,
	sessionsRelations,
];
