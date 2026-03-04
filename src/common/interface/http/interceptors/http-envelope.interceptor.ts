import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";
import { IHttpSuccessResponse } from "@apk_shared/types/http-response";
import { getField, hasField, isString, omitField } from "@apk_shared/types/utils";
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { catchError, map, Observable, tap, throwError } from "rxjs";

@Injectable()
export class HttpEnvelopeInterceptor implements NestInterceptor {
	private readonly logger: AppLogger;

	constructor(private readonly appLogger: AppLogger) {
		this.logger = appLogger.withContext(HttpEnvelopeInterceptor.name);
	}

	private buildResponseMessage(data: unknown): string {
		if (isString(data) && data.length > 0) return data;
		const message = getField(data, "message");
		if (isString(message) && message.length > 0) return message;
		return "Operation completed successfully";
	}

	private resolveErrorStatus(error: unknown): number {
		if (error instanceof HttpException) return error.getStatus();
		if (error instanceof BusinessLogicError) return HttpStatus.UNPROCESSABLE_ENTITY;
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	private resolveErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return "An unexpected error occurred";
	}

	intercept<T>(context: ExecutionContext, next: CallHandler): Observable<IHttpSuccessResponse<T | Omit<T, string>>> {
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

		// Marquer la request comme loggée par l'interceptor
		request.isLoggedByInterceptor = true;

		return next.handle().pipe(
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

			tap((rawData) => {
				const duration = Date.now() - startTimeMs;
				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${rawData.status} ] - ${path} \t - { ${rawData.message} } - took ${duration}ms`;

				if (rawData.status >= 400) this.logger.warn(logMessage);
				else this.logger.log(logMessage);
				response.isLoggedByInterceptor = true;
			}),

			catchError((error: unknown) => {
				const duration = Date.now() - startTimeMs;
				const status = this.resolveErrorStatus(error);
				const message = this.resolveErrorMessage(error);

				const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${status} ] - ${path} \t - { ${message} } - took ${duration}ms`;

				if (status >= 500) this.logger.error(logMessage, { error });
				else this.logger.warn(logMessage);
				response.isLoggedByInterceptor = true;

				return throwError(() => error);
			}),
		);
	}
}
