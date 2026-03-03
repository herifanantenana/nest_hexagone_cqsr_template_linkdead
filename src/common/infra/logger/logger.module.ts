import { Global, Module } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { AppLogger } from "./logger.service";
import { WinstonEngineService } from "./winston.engine";

@Global()
@Module({
	providers: [
		WinstonEngineService,
		{
			provide: WINSTON_MODULE_PROVIDER,
			inject: [WinstonEngineService],
			useFactory: (winstonEngineService: WinstonEngineService) => winstonEngineService.getLogger(),
		},
		AppLogger,
	],
	exports: [AppLogger],
})
export class LoggerModule {}
