import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { THttpErrorDetails } from "@apk_shared/types/http-response";
import { SafeAction } from "@apk_shared/infra/safe-action";
import { Injectable } from "@nestjs/common";

type TRedisLikeError = Error & {
	code?: string;
	command?: { name?: string };
};

@Injectable()
export class RedisSafeAction extends SafeAction<InfraException> {
	protected normalizeError(error: unknown, context?: Record<string, unknown>): InfraException {
		const details = this.buildDetails(error, context);

		if (this.isRedisLikeError(error)) {
			const redisError = error;
			const code = redisError.code;
			const message = redisError.message.toLowerCase();

			if (code && this.isNetworkCode(code)) {
				return new InfraException(
					"Redis network failure",
					503,
					"REDIS_NETWORK_FAILURE",
					details,
					"Redis service temporarily unavailable",
				);
			}

			if (message.includes("maxretriesperrequest") || message.includes("reached the max retries per request limit")) {
				return new InfraException(
					"Redis max retries per request reached",
					503,
					"REDIS_MAX_RETRIES_REACHED",
					details,
					"Redis service temporarily unavailable",
				);
			}

			if (
				message.includes("connection is closed") ||
				message.includes("connection is broken") ||
				message.includes("stream isn't writeable") ||
				message.includes("ready check failed")
			) {
				return new InfraException(
					"Redis connection unavailable",
					503,
					"REDIS_CONNECTION_UNAVAILABLE",
					details,
					"Redis service temporarily unavailable",
				);
			}

			if (message.includes("noauth") || message.includes("wrongpass")) {
				return new InfraException(
					"Redis authentication failed",
					503,
					"REDIS_AUTH_FAILED",
					details,
					"Redis service temporarily unavailable",
				);
			}

			if (message.includes("readonly")) {
				return new InfraException(
					"Redis readonly instance",
					503,
					"REDIS_READONLY_INSTANCE",
					details,
					"Redis service temporarily unavailable",
				);
			}

			if (message.includes("movEd".toLowerCase()) || message.includes("ask") || message.includes("clusterdown")) {
				return new InfraException(
					"Redis cluster routing failure",
					503,
					"REDIS_CLUSTER_FAILURE",
					details,
					"Redis service temporarily unavailable",
				);
			}
		}

		if (error instanceof Error) {
			return new InfraException(
				"Redis operation failed",
				503,
				"REDIS_OPERATION_FAILED",
				details,
				"Redis service temporarily unavailable",
			);
		}

		return new InfraException(
			"Unknown Redis error",
			503,
			"REDIS_UNKNOWN_ERROR",
			details,
			"Redis service temporarily unavailable",
		);
	}

	private isRedisLikeError(error: unknown): error is TRedisLikeError {
		return error instanceof Error;
	}

	private isNetworkCode(code: string): boolean {
		return ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE"].includes(code);
	}

	private buildDetails(error: unknown, context?: Record<string, unknown>): THttpErrorDetails {
		if (error instanceof Error) {
			const redisError = error as TRedisLikeError;

			return {
				causeMessage: error.message,
				stack: error.stack,
				code: redisError.code,
				command: redisError.command?.name,
				...context,
			};
		}

		return {
			cause: error,
			...context,
		};
	}
}
