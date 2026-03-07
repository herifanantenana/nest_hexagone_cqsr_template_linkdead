import { Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { existsSync, mkdirSync } from "fs";
import { pid } from "process";
import { loggerConfig } from "src/core//config";
import { inspect } from "util";
import * as winston from "winston";

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	verbose: 4,
};

const colors: Record<string, string> = {
	error: "\x1b[1;31m",
	warn: "\x1b[1;33m",
	info: "\x1b[1;32m",
	debug: "\x1b[1;34m",
	verbose: "\x1b[1m",
	reset: "\x1b[0m",
	dim: "\x1b[2m",
};

@Injectable()
export class WinstonAdapter {
	private logger: winston.Logger;

	constructor(
		@Inject(loggerConfig.KEY)
		private readonly loggerCfg: ConfigType<typeof loggerConfig>,
	) {
		const { level, dir, activeFiles } = this.loggerCfg;
		this.initLogger(level, dir, activeFiles);
	}

	private buildFilePrintFormat(info: winston.Logform.TransformableInfo): string {
		const { timestamp, level, message, context, ms, stack, ...meta } = info;

		const ctx = context ? `[${context as string}] ` : "";
		const msStr = ms ? ` (${ms as string})` : "";
		const extra = Object.keys(meta).length > 0 ? ` ${inspect(meta, { depth: 4, breakLength: 120 })}` : "";
		const stackStr = stack ? `\n${stack as string}` : "";
		const levelStr = level.toUpperCase().padEnd(7);

		return `${pid} - ${timestamp as string}   ${levelStr} ${ctx}${message as string}${msStr}${extra}${stackStr}`;
	}

	private buildFileTransport(level: string, dir: string): winston.transports.FileTransportInstance {
		return new winston.transports.File({
			dirname: dir,
			filename: `${level}.log`,
			level: level,
			format: winston.format.combine(
				winston.format((info) => (info.level === level || level === "verbose" ? info : false))(),
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss A" }),
				winston.format.errors({ stack: true }),
				winston.format.ms(),
				winston.format.printf((info) => this.buildFilePrintFormat(info)),
			),
		});
	}

	private buildConsolePrintFormat(info: winston.Logform.TransformableInfo): string {
		const { timestamp, level, message, context, ms, stack, ...meta } = info;
		const color = colors[level] ?? colors.reset;
		const reset = colors.reset;
		const dim = colors.dim;

		const ctx = context ? `${dim}[${context as string}]${reset} ` : "";
		const msStr = ms ? ` ${dim}${ms as string}${reset}` : "";
		const extra = Object.keys(meta).length > 0 ? ` ${inspect(meta, { depth: 4, breakLength: 120 })}` : "";
		const stackStr = stack ? `\n${stack as string}` : "";
		const levelStr = `${color}${level.toUpperCase().padEnd(7)}${reset}`;
		const appName = `${color}[App]${reset}`;
		const pidStr = `${dim}${pid}${reset}`;

		return `${appName} ${pidStr} - ${timestamp as string}   ${levelStr} ${ctx}${color}${message as string}${reset}${msStr}${extra}${stackStr}`;
	}

	private initLogger(level: string, dir: string, activeFile: boolean) {
		if (activeFile && !existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		const transports: winston.transport[] = [];

		// add console transport
		transports.push(
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.errors({ stack: true }),
					winston.format.timestamp({ format: "HH:mm:ss A" }),
					winston.format.ms(),
					winston.format.printf((info) => this.buildConsolePrintFormat(info)),
				),
			}),
		);

		// add file transport if enabled
		if (activeFile) {
			transports.push(this.buildFileTransport("error", dir));
			transports.push(this.buildFileTransport("warn", dir));
			transports.push(this.buildFileTransport("info", dir));
			transports.push(this.buildFileTransport("debug", dir));
			transports.push(this.buildFileTransport("verbose", dir));
		}

		// create the logger
		this.logger = winston.createLogger({ levels, level, transports });
	}

	getLogger(): winston.Logger {
		return this.logger;
	}
}
