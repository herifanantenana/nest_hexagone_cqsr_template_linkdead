import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm/sql/sql";

const envFile = `.env${process.env.NODE_ENV === "production" ? ".prod" : ".dev"}`;

dotenv.config({ path: envFile });
const connString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
const db = drizzle(connString);

async function resetDatabase() {
	console.log("<--- Resetting the database");
	try {
		// deactivate the referential integrity to avoid issues with foreign keys
		await db.execute(sql`SET session_replication_role = 'replica';`);

		// fetch all table names in the public schema
		const tablesResult = await db.execute(sql.raw(`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`));
		const tablesName = (tablesResult.rows as Array<{ tablename: string }>).map((row) => row.tablename);

		// truncate all tables and restart identity to reset auto-incrementing primary keys
		for (const table of tablesName) {
			console.log(` -- Truncating table: ${table}`);
			await db.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`));
		}

		console.log("---> Database reset successfully.");
	} catch (error) {
		console.error("---> Error resetting the database:", error);
	} finally {
		// Reactivate the referential integrity in case of error
		await db.execute(sql`SET session_replication_role = 'origin';`);
	}
}

async function main() {
	await resetDatabase();
}

void main();
