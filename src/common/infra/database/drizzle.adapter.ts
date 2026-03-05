import databaseEnvConfig from "@apk_common/config/database-env.config";
import { Inject, Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppLogger } from "../logger/logger.service";
import { enums, relations, schemas } from "./schemas";

const allSchemas = { ...schemas, ...enums };

const allRelations = relations.reduce((acc, relation) => {
	return { ...acc, ...relation };
}, {});

export type DbTx = NodePgDatabase<typeof allSchemas, typeof allRelations>;

@Injectable()
export class DrizzleAdapter implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
	private db: DbTx;
	private pool: Pool;
	private readonly logger: AppLogger;
	private isShuttingDown = false;

	constructor(
		@Inject(databaseEnvConfig.KEY) readonly databaseConfig: ConfigType<typeof databaseEnvConfig>,
		private readonly appLogger: AppLogger,
	) {
		this.logger = appLogger.withContext(DrizzleAdapter.name);

		const { user, password, host, port, name } = databaseConfig;
		if (!user || !password || !host || !port || !name) {
			throw new Error("Database configuration is missing required fields");
		}

		this.pool = new Pool({ connectionString: `postgresql://${user}:${password}@${host}:${port}/${name}` });
		this.db = drizzle({ client: this.pool, schema: allSchemas, relations: allRelations });
	}

	async onModuleInit() {
		try {
			await this.db.execute("SELECT 1");
			this.logger.log("Database drizzle connection SELECT 1 established successfully");
		} catch (error) {
			this.logger.error("Failed to connect to the database:", error);
			throw error;
		}
	}

	async onModuleDestroy() {
		await this.disconnectDrizzle("onModuleDestroy");
	}

	async onApplicationShutdown() {
		await this.disconnectDrizzle("onApplicationShutdown");
	}

	private async disconnectDrizzle(source: string) {
		if (this.isShuttingDown) {
			this.logger.debug(`Drizzle already disconnecting/disconnected, skipping ${source}`);
			return;
		}

		this.isShuttingDown = true;

		await this.pool.end();
		this.logger.log(`Drizzle connection pool ended (${source})`);
	}

	public getDb(tx?: unknown): DbTx {
		return (tx || this.db) as DbTx;
	}
}
