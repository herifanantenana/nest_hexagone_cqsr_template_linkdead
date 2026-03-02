import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import * as winston from "winston";

@Injectable()
export class AppLogger implements LoggerService {
	private context = "";
	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly winstonLoggerInstance: winston.Logger) {}

	setContext(context: string): void {
		this.context = context;
	}

	withContext(context: string): AppLogger {
		const child = new AppLogger(this.winstonLoggerInstance);
		child.setContext(context);
		return child;
	}

	private buildParams(params: unknown[]): Record<string, unknown> {
		const meta: Record<string, unknown> = {};
		if (this.context) {
			meta.context = this.context;
		}
		for (const param of params) {
			if (typeof param === "string" && !meta.context) {
				meta.context = param;
			} else if (typeof param === "object" && param !== null) {
				Object.assign(meta, param);
			}
		}
		return meta;
	}

	error(message: string, ...optionalParams: unknown[]) {
		this.winstonLoggerInstance.error(message, this.buildParams(optionalParams));
	}

	warn(message: string, ...optionalParams: unknown[]) {
		this.winstonLoggerInstance.warn(message, this.buildParams(optionalParams));
	}

	log(message: string, ...optionalParams: unknown[]): void {
		this.winstonLoggerInstance.info(message, this.buildParams(optionalParams));
	}

	debug(message: string, ...optionalParams: unknown[]): void {
		this.winstonLoggerInstance.debug(message, this.buildParams(optionalParams));
	}

	verbose(message: string, ...optionalParams: unknown[]): void {
		this.winstonLoggerInstance.verbose(message, this.buildParams(optionalParams));
	}
}
