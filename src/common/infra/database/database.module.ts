import { UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleEngineService } from "./drizzle.engine";
import { DrizzleUnitOfWorkAdapter } from "./unit-of-work.drizzle.adapter";

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		DrizzleEngineService,
		{
			provide: UNIT_OF_WORK,
			useClass: DrizzleUnitOfWorkAdapter,
		},
	],
	exports: [DrizzleEngineService, UNIT_OF_WORK],
})
export class DatabaseModule {}
