import { UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleAdapter } from "./drizzle.adapter";
import { DrizzleUnitOfWorkAdapter } from "./unit-of-work.drizzle.adapter";

@Global()
@Module({
	imports: [ConfigModule],
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
