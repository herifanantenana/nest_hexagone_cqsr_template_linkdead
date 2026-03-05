import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";
import { HttpErrorDetails, IHttpErrorResponse } from "@apk_shared/types/http-response";
import { isString } from "@apk_shared/types/utils";
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Request, Response } from "express";

interface IExtractedError {
	status: number;
	error: string;
	message: string;
	details?: HttpErrorDetails;
}

@Injectable()
@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
	private readonly logger: AppLogger;

	constructor(private readonly appLogger: AppLogger) {
		this.logger = appLogger.withContext("HttpEnvelopeInterceptor");
	}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const request = ctx.getRequest<Request>();
		const response = ctx.getResponse<Response>();

		if (
			exception instanceof ThrottlerException &&
			(!request.isLoggedByInterceptor || !response.isLoggedByInterceptor)
		) {
			this.logThrottlerException(request, response);
		}

		const extracted = this.extractErrorInfo(exception);

		const body: IHttpErrorResponse = {
			success: false,
			status: extracted.status,
			message: extracted.message,
			requestId: request.requestId ?? "unknown",
			timestamp: new Date().toISOString(),
			path: request.originalUrl || request.url,
			error: extracted.error,
			errorMessage: extracted.message,
			details: extracted.status >= 500 ? undefined : extracted.details,
		};

		response.status(extracted.status).json(body);
	}

	private logThrottlerException(request: Request, response: Response) {
		if (!request.startTimeMs) request.startTimeMs = Date.now();

		const { method, requestId, originalUrl, url, startTimeMs, ips, ip } = request;
		const path = originalUrl || url;

		if (!request.isLoggedByInterceptor) {
			const ipAddress = ip || (ips && ips.length > 0 ? ips[0] : undefined);
			const userAgent = request.headers["user-agent"] || "unknown-user-agent";

			// Log "Incoming REQUEST" comme HttpEnvelopeInterceptor
			this.logger.verbose(
				`Incoming REQUEST:\t\t ${requestId} <--- ${method} - ${path} \t from ${ipAddress} - ${userAgent}`,
			);
			request.isLoggedByInterceptor = true;
		}

		if (!response.isLoggedByInterceptor) {
			const status = HttpStatus.TOO_MANY_REQUESTS;
			const message = "ThrottlerException: Too Many Requests";
			const duration = Date.now() - startTimeMs;

			// Log "Outgoing RESPONSE" avec erreur 429 comme HttpEnvelopeInterceptor
			const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${status} ] - ${path} \t - { ${message} } - took ${duration}ms`;
			this.logger.warn(logMessage);
			response.isLoggedByInterceptor = true;
		}
	}

	private extractErrorInfo(exception: unknown): IExtractedError {
		if (exception instanceof HttpException) {
			return this.extractFromHttpException(exception);
		}

		if (exception instanceof ThrottlerException) {
			return this.extractFromThrottlerException(exception);
		}

		if (exception instanceof BusinessLogicError) {
			return this.extractFromBusinessLogicError(exception);
		}
		console.log("Unknown exception type caught by AllHttpExceptionsFilter:", exception);
		return this.extractFromUnknownException(exception);
	}

	private extractFromHttpException(exception: HttpException): IExtractedError {
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		let message: string;
		let details: HttpErrorDetails | undefined;

		if (isString(exceptionResponse)) {
			message = exceptionResponse;
		} else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
			const res = exceptionResponse as Record<string, unknown>;
			const msgField = res["message"];

			if (isString(msgField)) {
				message = msgField;
			} else if (Array.isArray(msgField)) {
				message = msgField.filter((m) => isString(m)).join("; ");
			} else {
				message = exception.message;
			}
			details = res["error"] ? (exceptionResponse as HttpErrorDetails) : undefined;
		} else {
			message = exception.message;
		}

		if (status >= 500) {
			this.logger.error(
				`HttpException caught: status=${status}, message=${message}, details=${JSON.stringify(details)}`,
				exception.stack,
			);
		}

		return {
			status,
			error: HttpStatus[status] ?? "UNKNOWN_ERROR",
			message,
			details,
		};
	}

	private extractFromThrottlerException(exception: ThrottlerException): IExtractedError {
		return {
			status: HttpStatus.TOO_MANY_REQUESTS,
			error: "TOO_MANY_REQUESTS",
			message: exception.message || "Too many requests",
		};
	}

	private extractFromBusinessLogicError(exception: BusinessLogicError): IExtractedError {
		return {
			status: exception.statusCode,
			error: exception.name,
			message: exception.message,
			details: exception.details,
		};
	}

	private extractFromUnknownException(exception: unknown): IExtractedError {
		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			error: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
			details: exception instanceof Error ? { stack: exception.stack } : undefined,
		};
	}
}
