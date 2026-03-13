import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import slugify from "slugify";

import uniqueSlug from "unique-slug";
import { categoriesTable } from "../schemas/taxonomies/categories.schema";
import { categoriesSkillsTable } from "../schemas/taxonomies/categoriesSkills.schema";
import { domainsTable } from "../schemas/taxonomies/domains.schema";
import { domainsSkillsTable } from "../schemas/taxonomies/domainsSkills.schema";
import { skillsTable } from "../schemas/taxonomies/skills.schema";

const runtime = process.env.APP_RUNTIME ?? "dev";
const envFile = `.env.${runtime}`;

dotenv.config({ path: envFile });

const connString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const pool = new Pool({ connectionString: connString });
const db = drizzle({ client: pool });

slugify.extend({
	a: "4",
	e: "3",
	i: "1",
	o: "0",
	s: "5",
	t: "7",
	g: "9",
	b: "8",
});

export function generateSlug(text: string): string {
	const slug = slugify(text, {
		lower: true,
		strict: true,
		trim: true,
	});
	return `${slug}-${uniqueSlug()}`;
}

type TDomainJson = {
	key: string;
	name: string;
};

type TCategoriesJson = {
	key: string;
	name: string;
	domainKey: string;
};

type TSkillsJson = {
	key: string;
	name: string;
	skillType: string;
	isGlobal: boolean;
};

type TDomainsSkillsJson = {
	domainKey: string;
	skillKey: string;
};

type TCategoriesSkillsJson = {
	categoryKey: string;
	skillKey: string;
};
const resourceDir = path.join(__dirname, "resources");
const domainsDataPath = path.join(resourceDir, "domains.json");
const categoriesDataPath = path.join(resourceDir, "categories.json");
const skillsDataPath = path.join(resourceDir, "skills.json");
const domainsSkillsDataPath = path.join(resourceDir, "domainsSkills.json");
const categoriesSkillsDataPath = path.join(resourceDir, "categoriesSkills.json");

function readJsonFile<T>(filePath: string): T[] {
	const data = fs.readFileSync(filePath, "utf-8");
	return JSON.parse(data) as T[];
}

// make sure all keys are unique in the provided data
function assertUniqueKeys<T extends { key: string }>(data: T[], entityName: string): void {
	const seen = new Set<string>();

	for (const item of data) {
		if (seen.has(item.key)) {
			throw new Error(`Duplicate key "${item.key}" found in ${entityName} data.`);
		}
		seen.add(item.key);
	}
}

const domainsData = readJsonFile<TDomainJson>(domainsDataPath);
const categoriesData = readJsonFile<TCategoriesJson>(categoriesDataPath);
const skillsData = readJsonFile<TSkillsJson>(skillsDataPath);
const domainsSkillsData = readJsonFile<TDomainsSkillsJson>(domainsSkillsDataPath);
const categoriesSkillsData = readJsonFile<TCategoriesSkillsJson>(categoriesSkillsDataPath);

function validateSeedData(): void {
	assertUniqueKeys(domainsData, "Domains");
	assertUniqueKeys(categoriesData, "Categories");
	assertUniqueKeys(skillsData, "Skills");

	const domainsKeys = new Set(domainsData.map((d) => d.key));
	const categoriesKeys = new Set(categoriesData.map((c) => c.key));
	const skillsKeys = new Set(skillsData.map((s) => s.key));

	// check that all domainKeys in categoriesData exist in domainsData
	for (const category of categoriesData) {
		if (!domainsKeys.has(category.domainKey)) {
			throw new Error(`Invalid domainKey "${category.domainKey}" in category "${category.key}".`);
		}
	}

	// check that all skillKeys in domainsSkillsData exist in skillsData and all domainKeys exist in domainsData
	for (const domainSkill of domainsSkillsData) {
		if (!skillsKeys.has(domainSkill.skillKey)) {
			throw new Error(`Invalid skillKey "${domainSkill.skillKey}" in domainsSkillsData.`);
		}
		if (!domainsKeys.has(domainSkill.domainKey)) {
			throw new Error(`Invalid domainKey "${domainSkill.domainKey}" in domainsSkillsData.`);
		}
	}

	// check that all skillKeys in categoriesSkillsData exist in skillsData and all categoryKeys exist in categoriesData
	for (const categorySkill of categoriesSkillsData) {
		if (!skillsKeys.has(categorySkill.skillKey)) {
			throw new Error(`Invalid skillKey "${categorySkill.skillKey}" in categoriesSkillsData.`);
		}
		if (!categoriesKeys.has(categorySkill.categoryKey)) {
			throw new Error(`Invalid categoryKey "${categorySkill.categoryKey}" in categoriesSkillsData.`);
		}
	}
}

async function upsertDomain(domain: TDomainJson): Promise<string> {
	const slug = generateSlug(domain.name);
	const [row] = await db
		.insert(domainsTable)
		.values({ name: domain.name, slug })
		.onConflictDoUpdate({
			target: domainsTable.slug,
			set: { name: domain.name, updatedAt: new Date() },
		})
		.returning({ id: domainsTable.id });
	return row.id;
}

async function upsertCategories(category: TCategoriesJson, domainId: string): Promise<string> {
	const slug = generateSlug(category.name);
	const [row] = await db
		.insert(categoriesTable)
		.values({ name: category.name, slug, domainId })
		.onConflictDoUpdate({
			target: [categoriesTable.domainId, categoriesTable.slug],
			set: {
				name: category.name,
				domainId,
				updatedAt: new Date(),
			},
		})
		.returning({ id: categoriesTable.id });
	return row.id;
}

async function upsertSkills(skill: TSkillsJson): Promise<string> {
	const slug = generateSlug(skill.name);
	const [row] = await db
		.insert(skillsTable)
		.values({ name: skill.name, slug, type: skill.skillType, isGlobal: skill.isGlobal })
		.onConflictDoUpdate({
			target: skillsTable.slug,
			set: { name: skill.name, isGlobal: skill.isGlobal, updatedAt: new Date() },
		})
		.returning({ id: skillsTable.id });
	return row.id;
}

async function linkDomainSkill(domainId: string, skillId: string): Promise<void> {
	await db
		.insert(domainsSkillsTable)
		.values({ domainId, skillId })
		.onConflictDoNothing({
			target: [domainsSkillsTable.domainId, domainsSkillsTable.skillId],
		});
}

async function linkCategorySkill(categoryId: string, skillId: string): Promise<void> {
	await db
		.insert(categoriesSkillsTable)
		.values({ categoryId, skillId })
		.onConflictDoNothing({
			target: [categoriesSkillsTable.categoryId, categoriesSkillsTable.skillId],
		});
}

async function seedTaxonomies(): Promise<void> {
	console.log("<--- Running taxonomies seed...");

	validateSeedData();

	const domainIdMap: Record<string, string> = {};
	// upsert domains and build domainIdMap
	for (const domain of domainsData) {
		const id = await upsertDomain(domain);
		domainIdMap[domain.key] = id;
	}
	console.log(" -- Domains upserted and domainIdMap built");

	// upsert skills and build skillIdMap
	const skillIdMap: Record<string, string> = {};
	for (const skill of skillsData) {
		const id = await upsertSkills(skill);
		skillIdMap[skill.key] = id;
	}
	console.log(" -- Skills upserted and skillIdMap built");

	// upsert categories and build categoryIdMap
	const categoryIdMap: Record<string, string> = {};
	for (const category of categoriesData) {
		const domainId = domainIdMap[category.domainKey];
		if (!domainId) {
			throw new Error(`Domain with key "${category.domainKey}" not found in domainIdMap.`);
		}
		const id = await upsertCategories(category, domainId);
		categoryIdMap[category.key] = id;
	}
	console.log(" -- Categories upserted and categoryIdMap built");

	// link domains to skills
	for (const domainSkill of domainsSkillsData) {
		const domainId = domainIdMap[domainSkill.domainKey];
		if (!domainId) {
			throw new Error(`Domain with key "${domainSkill.domainKey}" not found in domainIdMap.`);
		}
		const skillId = skillIdMap[domainSkill.skillKey];
		if (!skillId) {
			throw new Error(`Skill with key "${domainSkill.skillKey}" not found in skillIdMap.`);
		}
		await linkDomainSkill(domainId, skillId);
	}

	// link categories to skills
	for (const categorySkill of categoriesSkillsData) {
		const categoryId = categoryIdMap[categorySkill.categoryKey];
		if (!categoryId) {
			throw new Error(`Category with key "${categorySkill.categoryKey}" not found in categoryIdMap.`);
		}
		const skillId = skillIdMap[categorySkill.skillKey];
		if (!skillId) {
			throw new Error(`Skill with key "${categorySkill.skillKey}" not found in skillIdMap.`);
		}
		await linkCategorySkill(categoryId, skillId);
	}
	console.log(" -- Domains linked to skills and categories linked to skills");
	console.log("---> Taxonomies seeding completed successfully!");
}

void seedTaxonomies()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await pool.end();
	});
