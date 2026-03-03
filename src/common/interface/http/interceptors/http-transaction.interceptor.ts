import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { IHttpSuccessResponse } from "@apk_shared/types/http-response";
import { getField, hasField, isString, omitField } from "@apk_shared/types/utils";
import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { catchError, map, Observable, tap, throwError } from "rxjs";

@Injectable()
export class HttpTransactionInterceptor implements NestInterceptor {
	constructor(private readonly logger: AppLogger) {
		this.logger = logger.withContext(HttpTransactionInterceptor.name);
	}

	private buildResponseMessage(data: unknown): string {
		if (isString(data) && data.length > 0) return data;
		const message = getField(data, "message");
		if (isString(message) && message.length > 0) return message;
		return "Operation completed successfully";
	}

	private buildHttpExceptionMessage(error: HttpException) {
		const status = error.getStatus();
		const response = error.getResponse();

		let message: string | undefined;
		if (isString(response) && response.length > 0) {
			message = response;
		} else if (hasField(response, "message")) {
			const msgField = getField(response, "message");
			if (isString(msgField) && msgField.length > 0) {
				message = msgField;
			} else if (Array.isArray(msgField)) {
				const stringMessages = msgField.filter((m) => isString(m) && m.length > 0) as string[];
				if (stringMessages.length > 0) {
					message = stringMessages.join("; ");
				}
			}
		}
		if (!message) {
			message = "An error occurred while processing the request";
		}
		const details = status >= 400 && status < 500 ? response : error.stack;

		return { status, message, details };
	}

	private mapErrorResponseMessage(error: unknown): { status: number; message: string; details?: unknown } {
		if (error instanceof HttpException) {
			return this.buildHttpExceptionMessage(error);
		}
		return { status: 500, message: "An unexpected error occurred", details: error };
	}

	intercept<T>(context: ExecutionContext, next: CallHandler): Observable<IHttpSuccessResponse<T | Omit<T, string>>> {
		const httpContext = context.switchToHttp();
		const request = httpContext.getRequest<Request>();
		const response = httpContext.getResponse<Response>();

		// ensure startTimeMs presence
		if (!request.startTimeMs) request.startTimeMs = Date.now();

		const { method, url, requestId, originalUrl, startTimeMs, ips, ip } = request;
		const path = originalUrl || url;
		const ipAddress = ip || (ips && ips.length > 0 ? ips[0] : undefined);
		const userAgent = request.headers["user-agent"] || "unknown-user-agent";

		const logMessage = `Incoming REQUEST:\t ${requestId} <--- ${method} - ${path} \t from ${ipAddress} - ${userAgent}`;
		this.logger.verbose(logMessage);

		return next.handle().pipe(
			// transform the response
			map((rawData: T): IHttpSuccessResponse<Omit<T, string> | T> => {
				let data = rawData;
				const status = response.statusCode;
				const message = this.buildResponseMessage(rawData);
				const metadata = hasField(rawData, "metadata") ? getField(rawData, "metadata") : undefined;

				data = omitField(data, "metadata");
				data = omitField(data, "message");

				return {
					success: true,
					status,
					message,
					requestId,
					timestamp: new Date().toISOString(),
					path,
					data,
					metadata,
				};
			}),

			// log the success response
			tap((rawData) => {
				const duration = Date.now() - startTimeMs;
				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${rawData.status} ] - ${path} \t - { ${rawData.message} } - took ${duration}ms`;

				if (rawData.status >= 500) this.logger.error(logMessage);
				else if (rawData.status >= 400) this.logger.warn(logMessage);
				else this.logger.log(logMessage);

				return rawData;
			}),

			// log the error response
			catchError((error: unknown) => {
				const duration = Date.now() - startTimeMs;
				const { status, message, details } = this.mapErrorResponseMessage(error);

				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${status} ] - ${path} \t - { ${message} } - took ${duration}ms`;
				if (status >= 500) this.logger.error(logMessage, { details, error });
				else this.logger.warn(logMessage, { details, error });

				return throwError(() => error);
			}),
		);
	}
}
