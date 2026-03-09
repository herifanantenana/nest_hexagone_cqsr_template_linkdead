import { AppLogger } from "@apk_infra/logger/logger.service";
import { BusinessLogicException } from "@apk_shared/exceptions/business-logic.exception";
import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { THttpSuccessResponse } from "@apk_shared/types/http-response";
import { getField, hasField, isString, omitField } from "@apk_shared/types/utils";
import {
	CallHandler,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
	NestInterceptor,
	OnModuleInit,
} from "@nestjs/common";
import { Request, Response } from "express";
import { catchError, map, Observable, tap, throwError } from "rxjs";

@Injectable()
export class HttpEnvelopeInterceptor implements NestInterceptor, OnModuleInit {
	private readonly logger: AppLogger;

	constructor(private readonly appLogger: AppLogger) {
		this.logger = appLogger.withContext(HttpEnvelopeInterceptor.name);
	}

	onModuleInit() {
		this.logger.log("HttpEnvelopeInterceptor initialized");
	}

	private buildResponseMessage(data: unknown): string {
		if (isString(data) && data.length > 0) return data;
		const message = getField(data, "message");
		if (isString(message) && message.length > 0) return message;
		return "Operation completed successfully";
	}

	private resolveErrorStatus(error: unknown): number {
		if (error instanceof HttpException) return error.getStatus();
		if (error instanceof BusinessLogicException) return error.statusCode;
		if (error instanceof InfraException) return error.statusCode;
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	private resolveErrorMessage(error: unknown): string {
		if (error instanceof InfraException) return error.publicMessage;
		if (error instanceof Error) return error.message;
		return "An unexpected error occurred";
	}

	intercept<T>(context: ExecutionContext, next: CallHandler): Observable<THttpSuccessResponse<T | Omit<T, string>>> {
		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest<Request>();
		const response = httpContext.getResponse<Response>();

		if (!request.startTimeMs) request.startTimeMs = Date.now();

		const { method, requestId, originalUrl, url, startTimeMs, ips, ip } = request;
		const path = originalUrl || url;
		const ipAddress = ip || (ips && ips.length > 0 ? ips[0] : undefined);
		const userAgent = request.headers["user-agent"] || "unknown-user-agent";

		this.logger.verbose(
			`Incoming REQUEST:\t\t ${requestId} <--- ${method} - ${path} \t from ${ipAddress} - ${userAgent}`,
		);

		// mark the request as logged
		request.isLogged = true;

		return next.handle().pipe(
			map((rawData: T): THttpSuccessResponse<Omit<T, string> | T> => {
				let data = rawData;
				const message = this.buildResponseMessage(rawData);
				const metadata = hasField(rawData, "metadata") ? getField(rawData, "metadata") : undefined;

				const statusCode = hasField(rawData, "statusCode") ? getField(rawData, "statusCode") : response.statusCode;
				response.status(statusCode as number);
				data = omitField(data, "metadata");
				data = omitField(data, "message");

				return {
					success: true,
					status: statusCode as number,
					message,
					requestId,
					timestamp: new Date().toISOString(),
					path,
					data,
					metadata,
				};
			}),

			tap((rawData) => {
				const duration = Date.now() - startTimeMs;
				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${rawData.status} ] - ${path} \t - { ${rawData.message} } - took ${duration}ms`;

				if (rawData.status >= 400) this.logger.warn(logMessage);
				else this.logger.verbose(logMessage);
				response.isLogged = true;
			}),

			catchError((error: unknown) => {
				const duration = Date.now() - startTimeMs;
				const status = this.resolveErrorStatus(error);
				const message = this.resolveErrorMessage(error);

				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${status} ] - ${path} \t - { ${message} } - took ${duration}ms`;

				if (status >= 500) this.logger.error(logMessage, { error });
				else this.logger.warn(logMessage);
				response.isLogged = true;

				return throwError(() => error);
			}),
		);
	}
}
