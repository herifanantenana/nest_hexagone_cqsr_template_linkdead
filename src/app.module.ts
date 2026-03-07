import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import * as config from "./core/config";
import { InfraModule } from "./core/infra/infra.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			envFilePath: process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev",
			load: [...Object.values(config)],
		}),
		InfraModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
