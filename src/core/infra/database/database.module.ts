import { UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Module } from "@nestjs/common";
import { DrizzleAdapter } from "./adapters/drizzle.adapter";
import { DrizzleUnitOfWorkAdapter } from "./adapters/unit-of-work.drizzle.adapter";

@Module({
	imports: [],
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
