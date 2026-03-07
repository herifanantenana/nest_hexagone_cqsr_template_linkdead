import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./logger/logger.module";

@Global()
@Module({
	imports: [LoggerModule, DatabaseModule],
	exports: [LoggerModule, DatabaseModule],
})
export class InfraModule {}
