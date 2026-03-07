import { Inject, Injectable, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseConfig } from "src/core//config";
import type { TDatabaseConfig } from "src/core//config/root.config";
import { enums, relations, schemas } from "src/core//infra/database/schemas";
import { AppLogger } from "src/core//infra/logger/logger.service";

const allSchemas = schemas.reduce((acc, schema) => ({ ...acc, ...schema }), {});
const allEnums = enums.reduce((acc, en) => ({ ...acc, ...en }), {});
const allRelations = relations.reduce((acc, relation) => ({ ...acc, ...relation }), {});

// Combine schemas and enums for Drizzle
const drizzleSchemas = { ...allSchemas, ...allEnums };

export type TDbTx = NodePgDatabase<typeof allSchemas, typeof allRelations>;

@Injectable()
export class DrizzleAdapter implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
	private db: TDbTx;
	private pool: Pool;
	private readonly logger: AppLogger;
	private isShuttingDown = false;

	constructor(
		@Inject(databaseConfig.KEY) readonly databaseCfg: TDatabaseConfig,
		appLogger: AppLogger,
	) {
		this.logger = appLogger.withContext(this.databaseCfg.engine);

		const { user, password, host, port, name } = databaseCfg;
		if (!user || !password || !host || !port || !name) {
			throw new Error("Database configuration is missing required fields");
		}

		this.pool = new Pool({ connectionString: `postgresql://${user}:${password}@${host}:${port}/${name}` });
		this.db = drizzle({ client: this.pool, schema: drizzleSchemas, relations: allRelations });
	}

	async onModuleInit() {
		try {
			await this.db.execute("SELECT 1");
			this.logger.log(`${this.constructor.name} connection SELECT 1 established`);
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

	public getDb(tx?: unknown): TDbTx {
		return (tx || this.db) as TDbTx;
	}
}
