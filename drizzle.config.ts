import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const runtime = process.env.APP_RUNTIME ?? "dev";
const envFile = `.env.${runtime}`;

dotenv.config({ path: envFile, debug: true });

const connString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

export default defineConfig({
	dialect: "postgresql",
	schema: ["./src/core/infra/database/schemas/**/*.schema.ts", "./src/module/**/schemas/**/relations.ts"],
	out: "./src/core/infra/database/migrations",
	dbCredentials: {
		url: connString,
	},
	strict: true,
	verbose: true,
});
