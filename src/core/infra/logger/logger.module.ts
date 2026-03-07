import { Module } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { WinstonAdapter } from "./adapters/winston.adapter";
import { AppLogger } from "./logger.service";

@Module({
	providers: [
		WinstonAdapter,
		{
			provide: WINSTON_MODULE_PROVIDER,
			inject: [WinstonAdapter],
			useFactory: (winstonAdapter: WinstonAdapter) => winstonAdapter.getLogger(),
		},
		AppLogger,
	],
	exports: [AppLogger],
})
export class LoggerModule {}
