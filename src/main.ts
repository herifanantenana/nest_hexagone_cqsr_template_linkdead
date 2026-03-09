import { TAppConfig, TServerConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});

	// get app, server config
	const appCfg = app.get(ConfigService).get<TAppConfig>("app");
	const serverCfg = app.get(ConfigService).get<TServerConfig>("server");
	if (!appCfg) {
		throw new Error("App config is not defined");
	}
	if (!serverCfg) {
		throw new Error("Server config is not defined");
	}

	// set app logger
	const logger = app.get(AppLogger).withContext(appCfg.name);
	app.useLogger(logger);
	app.flushLogs();

	// set up proxy
	app.set("trust proxy", serverCfg.trustProxy);
	logger.log(`Trust proxy ${serverCfg.trustProxy ? "enabled" : "disabled"}`);

	// set up helmet - allow Swagger UI inline scripts/styles
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					...helmet.contentSecurityPolicy.getDefaultDirectives(),
					"script-src": ["'self'", "'unsafe-inline'"],
					"style-src": ["'self'", "'unsafe-inline'"],
					"img-src": ["'self'", "data:", "validator.swagger.io"],
					"upgrade-insecure-requests": null,
				},
			},
			crossOriginOpenerPolicy: false,
			originAgentCluster: false,
			crossOriginEmbedderPolicy: false,
		}),
	);
	logger.log("Helmet enable");

	// set up cors
	app.enableCors({
		origin: serverCfg.allowedCorsOrigins,
		credentials: true,
	});
	logger.log(`CORS enabled for origins: ${serverCfg.allowedCorsOrigins.join(", ")}`);

	// set up prefix
	app.setGlobalPrefix(serverCfg.apiPathPrefix);
	logger.log(`Global API prefix set to: ${serverCfg.apiPathPrefix}`);

	// set up global pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);
	logger.log("Global validation pipe configured");

	// set up swagger
	const swaggerConfig = new DocumentBuilder()
		.setTitle("Linkdead API")
		.setDescription("API documentation for Linkdead application")
		.setVersion("1.0.2")
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup(serverCfg.docsPathPrefix, app, document, {
		swaggerOptions: {
			withCredentials: true,
		},
	});

	await app.listen(serverCfg.port, serverCfg.listenHost, () => {
		logger.log(`${appCfg.name} is running on ${appCfg.isProd ? "production" : "development"} mode`);
	});

	const appDomain = await app.getUrl();
	logger.log(`${appCfg.name} server is running at: ${appDomain}/${serverCfg.apiPathPrefix}`);
	logger.log(`${appCfg.name} docs is available at: ${appDomain}/${serverCfg.docsPathPrefix}`);
}

void bootstrap();
