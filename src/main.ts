import appEnvConfig from "@apk_common/config/app-env.config";
import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService, type ConfigType } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});
	// set up logger and flush buffered logs
	const logger = app.get(AppLogger).withContext("Bootstrap");
	app.useLogger(logger);
	app.flushLogs();

	// get app config and log startup info
	const appConfig = app.get(ConfigService).get<ConfigType<typeof appEnvConfig>>("app");
	if (!appConfig) {
		logger.error("App configuration is missing");
		process.exit(1);
	}
	const { isProduction, host, port, trustProxy, crossOrigin, allowedOrigins, prefix } = appConfig;

	// trust proxy if enabled
	if (trustProxy) {
		app.set("trust proxy", 1);
		logger.log("Trust proxy enabled");
	} else logger.log("Trust proxy disabled");

	// enable CORS
	app.enableCors({
		origin: crossOrigin ? allowedOrigins : false,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
		preflightContinue: false,
		optionsSuccessStatus: 204,
	});
	logger.log(`CORS enabled for origin: ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "to all origins"}`);

	// set global prefix
	app.setGlobalPrefix(prefix);

	// set up global validation pipe
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

	// enable shutdown hooks for graceful shutdown
	app.enableShutdownHooks();

	const swaggerConfig = new DocumentBuilder()
		.setTitle("Linkdead API")
		.setDescription("API documentation for Linkdead application")
		.setVersion("1.0.2")
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	const swaggerPrefix = isProduction ? "docs" : "dev-docs";
	SwaggerModule.setup(swaggerPrefix, app, document, {
		swaggerOptions: {
			withCredentials: true,
		},
	});

	await app.listen(port, host, () => {
		logger.log(`API server is running in ${isProduction ? "production" : "development"} mode`);
	});

	const appDomain = await app.getUrl();
	logger.log(`API server available at: ${appDomain}/${prefix}`);
	logger.log(`API documentation available at: ${appDomain}/${swaggerPrefix}`);
}
void bootstrap();
