import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm/sql/sql";
import fs from "fs";
import path from "path";

const envFile = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`;
dotenv.config({ path: envFile });
const connString = `postgresql://${process.env.USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
const db = drizzle(connString);
const migrationsDir = path.resolve(__dirname, "../migrations");

async function cleanDatabase() {
	console.log("<--- Resetting the database");
	try {
		// delete only all folder in the migrations directory, not the directory itself
		if (fs.existsSync(migrationsDir)) {
			const files = fs.readdirSync(migrationsDir);
			for (const file of files) {
				const filePath = path.join(migrationsDir, file);
				if (fs.lstatSync(filePath).isDirectory()) {
					fs.rmSync(filePath, { recursive: true, force: true });
					console.log(" -- Deleted migration directory:", filePath);
				}
			}
		} else {
			console.log(" -- Migrations directory does not exist, skipping migration cleanup:", migrationsDir);
		}

		// deactivate the referential integrity to avoid issues with foreign keys
		await db.execute(sql`SET session_replication_role = 'replica';`);

		// fetch all table names in the public schema
		const tablesResult = await db.execute(sql.raw(`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`));
		const tableNames = (tablesResult.rows as Array<{ tablename: string }>).map((row) => row.tablename);

		// drop all tables
		for (const table of tableNames) {
			await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
			console.log(` -- Table ${table} : deleted`);
		}

		// fetch all enum types in the public schema
		const enumsResult = await db.execute(sql.raw(`SELECT typname FROM pg_type WHERE typtype = 'e';`));
		const enumNames = (enumsResult.rows as Array<{ typname: string }>).map((row) => row.typname);
		// drop all enum types
		for (const enumName of enumNames) {
			await db.execute(sql.raw(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`));
			console.log(` -- Enum ${enumName} : deleted.`);
		}

		// fetch all views in the public schema
		const viewsResult = await db.execute(
			sql.raw(`SELECT table_name FROM information_schema.views WHERE table_schema = 'public';`),
		);
		const viewNames = (viewsResult.rows as Array<{ table_name: string }>).map((row) => row.table_name);
		// drop all views
		for (const viewName of viewNames) {
			await db.execute(sql.raw(`DROP VIEW IF EXISTS "${viewName}" CASCADE;`));
			console.log(` -- View ${viewName} : deleted.`);
		}

		console.log("---> Database cleaned successfully.");
	} catch (error) {
		console.error("Error cleaning database:", error);
	} finally {
		// Reactivate the referential integrity
		await db.execute(sql`SET session_replication_role = 'origin';`);
	}
}

async function main() {
	await cleanDatabase();
}

void main();
