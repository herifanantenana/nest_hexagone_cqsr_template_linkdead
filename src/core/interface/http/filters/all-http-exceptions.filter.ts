import { AppLogger } from "@apk_infra/logger/logger.service";
import { BusinessLogicException } from "@apk_shared/exceptions/business-logic.exception";
import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { THttpErrorDetails, THttpErrorResponse } from "@apk_shared/types/http-response";
import { isString } from "@apk_shared/types/utils";
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Injectable,
	OnModuleInit,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Request, Response } from "express";

interface IExtractedError {
	status: number;
	error: string;
	message: string;
	details?: THttpErrorDetails;
}

@Injectable()
@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter, OnModuleInit {
	private readonly logger: AppLogger;

	constructor(private readonly appLogger: AppLogger) {
		this.logger = appLogger.withContext(AllHttpExceptionsFilter.name);
	}

	onModuleInit() {
		this.logger.log("AllHttpExceptionsFilter initialized");
	}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const request = ctx.getRequest<Request>();
		const response = ctx.getResponse<Response>();

		if (exception instanceof ThrottlerException && (!request.isLogged || !response.isLogged)) {
			this.logThrottlerException(request, response);
		}

		const extracted = this.extractErrorInfo(exception);

		const body: THttpErrorResponse = {
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

		if (!request.isLogged) {
			const ipAddress = ip || (ips && ips.length > 0 ? ips[0] : undefined);
			const userAgent = request.headers["user-agent"] || "unknown-user-agent";

			// Log "Incoming REQUEST" like HttpEnvelopeInterceptor
			this.logger.verbose(
				`Incoming REQUEST:\t\t ${requestId} <--- ${method} - ${path} \t from ${ipAddress} - ${userAgent}`,
			);
			request.isLogged = true;
		}

		if (!response.isLogged) {
			const status = HttpStatus.TOO_MANY_REQUESTS;
			const message = "Too Many Requests";
			const duration = Date.now() - startTimeMs;

			// Log "Outgoing RESPONSE" with error 429 like HttpEnvelopeInterceptor
			const logMessage = `Outgoing RESPONSE:\t ${requestId} ---> ${method} - [ ${status} ] - ${path} \t - { ${message} } - took ${duration}ms`;
			this.logger.warn(logMessage);
			response.isLogged = true;
		}
	}

	private extractErrorInfo(exception: unknown): IExtractedError {
		if (exception instanceof HttpException) {
			return this.extractFromHttpException(exception);
		}

		if (exception instanceof ThrottlerException) {
			return this.extractFromThrottlerException(exception);
		}

		if (exception instanceof BusinessLogicException) {
			return this.extractFromBusinessLogicError(exception);
		}

		if (exception instanceof InfraException) {
			return this.extractFromInfraException(exception);
		}

		console.log("Unknown exception type caught by AllHttpExceptionsFilter:", exception);
		return this.extractFromUnknownException(exception);
	}

	private extractFromHttpException(exception: HttpException): IExtractedError {
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		let message: string;
		let details: THttpErrorDetails | undefined;

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
			details = res["error"] ? (exceptionResponse as THttpErrorDetails) : undefined;
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

	private extractFromBusinessLogicError(exception: BusinessLogicException): IExtractedError {
		return {
			status: exception.statusCode,
			error: exception.name,
			message: exception.message,
			details: exception.details,
		};
	}

	private extractFromInfraException(exception: InfraException): IExtractedError {
		return {
			status: exception.statusCode,
			error: exception.code,
			message: exception.publicMessage,
			details: exception.statusCode >= 500 ? undefined : exception.details,
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
