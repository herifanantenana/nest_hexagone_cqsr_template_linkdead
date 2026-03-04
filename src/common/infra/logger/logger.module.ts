import { Module } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { AppLogger } from "./logger.service";
import { WinstonAdapter } from "./winston.adapter";

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
