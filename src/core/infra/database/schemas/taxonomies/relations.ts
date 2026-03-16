import { defineRelationsPart } from "drizzle-orm";
import { exploitsTable } from "../exploits/exploits.schema";
import { exploitsCategoriesTable } from "../exploits/exploitsCategories.schema";
import { exploitsSkillsTable } from "../exploits/exploitsSkills.schema";
import { categoriesTable } from "./categories.schema";
import { categoriesSkillsTable } from "./categoriesSkills.schema";
import { domainsTable } from "./domains.schema";
import { domainsSkillsTable } from "./domainsSkills.schema";
import { skillsTable } from "./skills.schema";

export const domainsRelations = defineRelationsPart(
	{ domainsTable, categoriesTable, skillsTable, domainsSkillsTable, exploitsTable },
	(r) => ({
		domainsTable: {
			// one domain has many categories
			categories: r.many.categoriesTable({
				from: r.domainsTable.id,
				to: r.categoriesTable.domainId,
			}),
			// one domain has many skills through domainsSkills
			skills: r.many.skillsTable({
				from: r.domainsTable.id.through(r.domainsSkillsTable.domainId),
				to: r.skillsTable.id.through(r.domainsSkillsTable.skillId),
			}),
			// one domain has many exploits
			exploits: r.many.exploitsTable({
				from: r.domainsTable.id,
				to: r.exploitsTable.domainId,
			}),
		},
	}),
);

export const categoriesRelations = defineRelationsPart(
	{ categoriesTable, domainsTable, skillsTable, categoriesSkillsTable, exploitsTable, exploitsCategoriesTable },
	(r) => ({
		categoriesTable: {
			// one category belongs to one domain
			domain: r.one.domainsTable({
				from: r.categoriesTable.domainId,
				to: r.domainsTable.id,
			}),

			// one category has many skills through categoriesSkills
			skills: r.many.skillsTable({
				from: r.categoriesTable.id.through(r.categoriesSkillsTable.categoryId),
				to: r.skillsTable.id.through(r.categoriesSkillsTable.skillId),
			}),

			// one category has many exploits through exploitsCategories
			exploits: r.many.exploitsTable({
				from: r.categoriesTable.id.through(r.exploitsCategoriesTable.categoryId),
				to: r.exploitsTable.id.through(r.exploitsCategoriesTable.exploitId),
			}),
		},
	}),
);

export const skillsRelations = defineRelationsPart(
	{
		skillsTable,
		domainsTable,
		categoriesTable,
		domainsSkillsTable,
		categoriesSkillsTable,
		exploitsTable,
		exploitsSkillsTable,
	},
	(r) => ({
		skillsTable: {
			// one skill belongs to many domains through domainsSkills
			domains: r.many.domainsTable({
				from: r.skillsTable.id.through(r.domainsSkillsTable.skillId),
				to: r.domainsTable.id.through(r.domainsSkillsTable.domainId),
			}),

			// one skill belongs to many categories through categoriesSkills
			categories: r.many.categoriesTable({
				from: r.skillsTable.id.through(r.categoriesSkillsTable.skillId),
				to: r.categoriesTable.id.through(r.categoriesSkillsTable.categoryId),
			}),

			// one skill belongs to many exploits through exploitsSkills
			exploits: r.many.exploitsTable({
				from: r.skillsTable.id.through(r.exploitsSkillsTable.skillId),
				to: r.exploitsTable.id.through(r.exploitsSkillsTable.exploitId),
			}),
		},
	}),
);
