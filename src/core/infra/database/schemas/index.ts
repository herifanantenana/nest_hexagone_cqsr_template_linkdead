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
import { categoriesTable } from "./taxonomies/categories.schema";
import { categoriesSkillsTable } from "./taxonomies/categoriesSkills.schema";
import { domainsTable } from "./taxonomies/domains.schema";
import { domainsSkillsTable } from "./taxonomies/domainsSkills.schema";
import { categoriesRelations, domainsRelations, skillsRelations } from "./taxonomies/relations";
import { skillsTable, skillsTypesEnum } from "./taxonomies/skills.schema";

// export const enums = [
// 	authProvidersEnum,
// 	accountStatusEnum,
// 	organizationTypesEnum,
// 	organizationStatusEnum,
// 	actorsTypesEnum,
// 	sessionsStatusEnum,
// 	skillsTypesEnum,
// ];

// export const schemas = [
// 	registrationsTable,
// 	usersTable,
// 	accountsTable,
// 	organizationsTable,
// 	actorsTable,
// 	sessionsTable,
// 	domainsTable,
// 	categoriesTable,
// 	skillsTable,
// 	domainsSkillsTable,
// 	categoriesSkillsTable,
// ];

// export const relations = [
// 	usersRelations,
// 	accountsRelations,
// 	organizationsRelations,
// 	actorsRelations,
// 	sessionsRelations,
// 	domainsRelations,
// 	categoriesRelations,
// 	skillsRelations,
// ];

// Prefer these exports for Drizzle initialization to preserve strong types (db.query.*)
export const drizzleSchema = {
	registrationsTable,
	usersTable,
	accountsTable,
	organizationsTable,
	actorsTable,
	sessionsTable,
	domainsTable,
	categoriesTable,
	skillsTable,
	domainsSkillsTable,
	categoriesSkillsTable,

	authProvidersEnum,
	accountStatusEnum,
	organizationTypesEnum,
	organizationStatusEnum,
	actorsTypesEnum,
	sessionsStatusEnum,
	skillsTypesEnum,
} as const;

export const drizzleRelations = {
	...usersRelations,
	...accountsRelations,
	...organizationsRelations,
	...actorsRelations,
	...sessionsRelations,
	...domainsRelations,
	...categoriesRelations,
	...skillsRelations,
} as const;
