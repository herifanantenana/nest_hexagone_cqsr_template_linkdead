import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { THttpErrorDetails } from "@apk_shared/types/http-response";
import { SafeAction } from "@apk_shared/infra/safe-action";
import { Injectable } from "@nestjs/common";

type TPostgresLikeError = Error & {
	code?: string;
	severity?: string;
	detail?: string;
	hint?: string;
	table?: string;
	schema?: string;
	column?: string;
	constraint?: string;
	routine?: string;
};

@Injectable()
export class DatabaseSafeAction extends SafeAction<InfraException> {
	protected normalizeError(error: unknown, context?: Record<string, unknown>): InfraException {
		const details = this.buildDetails(error, context);

		if (this.isPostgresLikeError(error)) {
			const code = error.code;

			// SQLSTATE / PostgreSQL common cases
			switch (code) {
				case "23505":
					return new InfraException(
						"PostgreSQL unique constraint violation",
						409,
						"DATABASE_UNIQUE_VIOLATION",
						details,
						"A resource with the same unique value already exists",
					);

				case "23503":
					return new InfraException(
						"PostgreSQL foreign key violation",
						409,
						"DATABASE_FOREIGN_KEY_VIOLATION",
						details,
						"This operation violates a related resource constraint",
					);

				case "23502":
					return new InfraException(
						"PostgreSQL not-null violation",
						400,
						"DATABASE_NOT_NULL_VIOLATION",
						details,
						"A required database value is missing",
					);

				case "23514":
					return new InfraException(
						"PostgreSQL check constraint violation",
						400,
						"DATABASE_CHECK_VIOLATION",
						details,
						"A database validation rule was violated",
					);

				case "22P02":
					return new InfraException(
						"PostgreSQL invalid text representation",
						400,
						"DATABASE_INVALID_TEXT_REPRESENTATION",
						details,
						"An invalid database value format was provided",
					);

				case "40001":
					return new InfraException(
						"PostgreSQL serialization failure",
						409,
						"DATABASE_SERIALIZATION_FAILURE",
						details,
						"The operation conflicted with another concurrent transaction",
					);

				case "40P01":
					return new InfraException(
						"PostgreSQL deadlock detected",
						409,
						"DATABASE_DEADLOCK_DETECTED",
						details,
						"The operation conflicted with another concurrent transaction",
					);

				case "53300":
					return new InfraException(
						"PostgreSQL too many connections",
						503,
						"DATABASE_TOO_MANY_CONNECTIONS",
						details,
						"Database service temporarily unavailable",
					);

				case "57P01":
					return new InfraException(
						"PostgreSQL admin shutdown",
						503,
						"DATABASE_ADMIN_SHUTDOWN",
						details,
						"Database service temporarily unavailable",
					);

				case "08001":
				case "08003":
				case "08004":
				case "08006":
				case "08007":
					return new InfraException(
						"PostgreSQL connection failure",
						503,
						"DATABASE_CONNECTION_FAILURE",
						details,
						"Database service temporarily unavailable",
					);
			}
		}

		if (this.isNetworkError(error)) {
			return new InfraException(
				"Database network failure",
				503,
				"DATABASE_NETWORK_FAILURE",
				details,
				"Database service temporarily unavailable",
			);
		}

		if (error instanceof Error) {
			return new InfraException(
				"Database operation failed",
				500,
				"DATABASE_OPERATION_FAILED",
				details,
				"Database service temporarily unavailable",
			);
		}

		return new InfraException(
			"Unknown database error",
			500,
			"DATABASE_UNKNOWN_ERROR",
			details,
			"Database service temporarily unavailable",
		);
	}

	private isPostgresLikeError(error: unknown): error is TPostgresLikeError {
		return (
			error instanceof Error &&
			(typeof (error as TPostgresLikeError).code === "string" ||
				typeof (error as TPostgresLikeError).severity === "string" ||
				typeof (error as TPostgresLikeError).constraint === "string")
		);
	}

	private isNetworkError(error: unknown): error is NodeJS.ErrnoException {
		return (
			error instanceof Error &&
			typeof (error as NodeJS.ErrnoException).code === "string" &&
			["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE"].includes(
				(error as NodeJS.ErrnoException).code ?? "",
			)
		);
	}

	private buildDetails(error: unknown, context?: Record<string, unknown>): THttpErrorDetails {
		if (error instanceof Error) {
			const pgError = error as TPostgresLikeError;

			return {
				causeMessage: error.message,
				stack: error.stack,
				code: pgError.code,
				severity: pgError.severity,
				detail: pgError.detail,
				hint: pgError.hint,
				schema: pgError.schema,
				table: pgError.table,
				column: pgError.column,
				constraint: pgError.constraint,
				routine: pgError.routine,
				...context,
			};
		}

		return {
			cause: error,
			...context,
		};
	}
}
