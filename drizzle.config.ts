import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const envFile = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`;

dotenv.config({ path: envFile, debug: true });

const connString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

export default defineConfig({
	dialect: "postgresql",
	schema: ["./src/common/infra/database/schemas/**/*.schema.ts", "./src/module/**/schemas/**/relations.ts"],
	out: "./src/common/infra/database/migrations",
	dbCredentials: {
		url: connString,
	},
	strict: true,
	verbose: true,
});
