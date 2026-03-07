import { accountsTable, accountStatusEnum, authProvidersEnum } from "./authentications/accounts.schema";
import { actorsTable, actorsTypesEnum } from "./authentications/actors.schema";
import { registrationsTable } from "./authentications/registrations.schema";
import { accountsRelations, actorsRelations, sessionsRelations, usersRelations } from "./authentications/relations";
import { sessionsStatusEnum, sessionsTable } from "./authentications/sessions.schema";
import { usersTable } from "./authentications/users.schema";
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

export const schemas = [registrationsTable, usersTable, accountsTable, organizationsTable, actorsTable, sessionsTable];

export const relations = [
	usersRelations,
	accountsRelations,
	organizationsRelations,
	actorsRelations,
	sessionsRelations,
];
