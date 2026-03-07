import { TAppConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});

	// get app config
	const appCfg = app.get(ConfigService).get<TAppConfig>("app");
	if (!appCfg) {
		throw new Error("App config is not defined");
		process.exit(1);
	}

	// set app logger
	const logger = app.get(AppLogger).withContext(appCfg.name);
	app.useLogger(logger);
	app.flushLogs();

	await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
