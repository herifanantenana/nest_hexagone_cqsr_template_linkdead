import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

function getClient() {
	const runtime = process.env.APP_RUNTIME ?? "dev";
	const envFile = `.env.${runtime}`;
	dotenv.config({ path: envFile });

	const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
	const client = new Client({ connectionString });
	return client;
}

async function runPostMigration() {
	const client = getClient();

	try {
		await client.connect();
		console.log("<--- Running post-migration SQL...");

		const sqlPath = join(__dirname, "../migrations/post-migrate.sql");
		const sql = readFileSync(sqlPath, "utf-8");

		await client.query(sql);

		console.log(" -- Post-migration completed successfully.");
		console.log(" -- Added partial unique index on actors.user_id");
		console.log(" -- Added partial unique index on actors.organization_id");
		console.log("---> Post-migration SQL executed successfully.");
	} catch (err) {
		console.error("---> Error during post-migration:", err);
		process.exit(1);
	} finally {
		await client.end();
	}
}

void runPostMigration();
