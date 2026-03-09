import { UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module";
import { DrizzleAdapter } from "./adapters/drizzle.adapter";
import { DrizzleUnitOfWorkAdapter } from "./adapters/unit-of-work.drizzle.adapter";
import { DatabaseSafeAction } from "./database-safe-action";

@Module({
	imports: [LoggerModule],
	providers: [
		DrizzleAdapter,
		{
			provide: UNIT_OF_WORK,
			useClass: DrizzleUnitOfWorkAdapter,
		},
		DatabaseSafeAction,
	],
	exports: [DrizzleAdapter, UNIT_OF_WORK, DatabaseSafeAction],
})
export class DatabaseModule {}
