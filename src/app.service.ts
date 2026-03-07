import { Inject, Injectable } from "@nestjs/common";
import { appConfig } from "./core/config";
import { type TAppConfig } from "./core/config/root.config";

@Injectable()
export class AppService {
	constructor(@Inject(appConfig.KEY) private readonly config: TAppConfig) {}
	getHello(): string {
		console.log("appConfig", this.config);

		return "Hello World!";
	}
}
