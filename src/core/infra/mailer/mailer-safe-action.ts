import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { THttpErrorDetails } from "@apk_shared/types/http-response";
import { SafeAction } from "@apk_shared/infra/safe-action";
import { Injectable } from "@nestjs/common";

type TNodemailerLikeError = Error & {
	code?: string;
	response?: string;
	responseCode?: number;
	command?: string;
};

@Injectable()
export class MailerSafeAction extends SafeAction<InfraException> {
	protected normalizeError(error: unknown, context?: Record<string, unknown>): InfraException {
		const details = this.buildDetails(error, context);

		if (this.isNodemailerLikeError(error)) {
			const code = error.code;
			const responseCode = error.responseCode;
			const message = error.message.toLowerCase();

			if (code && this.isNetworkCode(code)) {
				return new InfraException(
					"Mailer network failure",
					503,
					"MAILER_NETWORK_FAILURE",
					details,
					"Mail service temporarily unavailable",
				);
			}

			if (responseCode === 535 || message.includes("invalid login")) {
				return new InfraException(
					"Mailer authentication failed",
					503,
					"MAILER_AUTH_FAILED",
					details,
					"Mail service temporarily unavailable",
				);
			}

			if (responseCode === 530) {
				return new InfraException(
					"Mailer requires a secure transport or authentication state",
					503,
					"MAILER_SECURITY_REQUIREMENT",
					details,
					"Mail service temporarily unavailable",
				);
			}

			if (responseCode === 553) {
				return new InfraException(
					"Mailer recipient or sender rejected",
					400,
					"MAILER_ADDRESS_REJECTED",
					details,
					"The email address was rejected by the mail server",
				);
			}

			if (typeof responseCode === "number" && responseCode >= 500) {
				return new InfraException(
					"Mailer permanent SMTP failure",
					503,
					"MAILER_PERMANENT_SMTP_FAILURE",
					details,
					"Mail service temporarily unavailable",
				);
			}

			if (typeof responseCode === "number" && responseCode >= 400) {
				return new InfraException(
					"Mailer temporary SMTP failure",
					503,
					"MAILER_TEMPORARY_SMTP_FAILURE",
					details,
					"Mail service temporarily unavailable",
				);
			}

			if (
				code === "EENVELOPE" ||
				code === "EMESSAGE" ||
				code === "EINVALID" ||
				message.includes("invalid recipient") ||
				message.includes("no recipients defined")
			) {
				return new InfraException(
					"Mailer message or envelope validation failed",
					400,
					"MAILER_VALIDATION_FAILED",
					details,
					"The email payload is invalid",
				);
			}
		}

		if (error instanceof Error) {
			return new InfraException(
				"Mailer operation failed",
				503,
				"MAILER_OPERATION_FAILED",
				details,
				"Mail service temporarily unavailable",
			);
		}

		return new InfraException(
			"Unknown mailer error",
			503,
			"MAILER_UNKNOWN_ERROR",
			details,
			"Mail service temporarily unavailable",
		);
	}

	private isNodemailerLikeError(error: unknown): error is TNodemailerLikeError {
		return error instanceof Error;
	}

	private isNetworkCode(code: string): boolean {
		return ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE", "ESOCKET"].includes(code);
	}

	private buildDetails(error: unknown, context?: Record<string, unknown>): THttpErrorDetails {
		if (error instanceof Error) {
			const mailerError = error as TNodemailerLikeError;

			return {
				causeMessage: error.message,
				stack: error.stack,
				code: mailerError.code,
				response: mailerError.response,
				responseCode: mailerError.responseCode,
				command: mailerError.command,
				...context,
			};
		}

		return {
			cause: error,
			...context,
		};
	}
}
