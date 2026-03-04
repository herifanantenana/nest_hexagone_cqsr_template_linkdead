import { UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../logger/logger.module";
import { DrizzleAdapter } from "./drizzle.adapter";
import { DrizzleUnitOfWorkAdapter } from "./unit-of-work.drizzle.adapter";

@Module({
	imports: [ConfigModule, LoggerModule],
	providers: [
		DrizzleAdapter,
		{
			provide: UNIT_OF_WORK,
			useClass: DrizzleUnitOfWorkAdapter,
		},
	],
	exports: [DrizzleAdapter, UNIT_OF_WORK],
})
export class DatabaseModule {}
