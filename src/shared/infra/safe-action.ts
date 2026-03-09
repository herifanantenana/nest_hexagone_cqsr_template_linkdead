import { InfraException } from "@apk_shared/exceptions/infra.exception";
import { ISafeResponse } from "./safe-response";
import { toSafeError, toSafeOK } from "./utils";

export abstract class SafeAction<E extends InfraException = InfraException> {
	protected abstract normalizeError(error: unknown, context?: Record<string, unknown>): E;

	public withSafe<T>(action: () => T, context?: Record<string, unknown>): ISafeResponse<T, E> {
		try {
			return toSafeOK(action());
		} catch (error) {
			return toSafeError(this.normalizeError(error, context));
		}
	}

	public withSafeOrThrow<T>(action: () => T, context?: Record<string, unknown>): T {
		const result = this.withSafe(action, context);
		if (!result.ok) {
			throw result.error;
		}
		return result.data;
	}

	public async withSafeAsync<T>(
		action: () => Promise<T>,
		context?: Record<string, unknown>,
	): Promise<ISafeResponse<T, E>> {
		try {
			return toSafeOK(await action());
		} catch (error) {
			return toSafeError(this.normalizeError(error, context));
		}
	}

	public async withSafeAsyncOrThrow<T>(action: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
		const result = await this.withSafeAsync(action, context);
		if (!result.ok) {
			throw result.error;
		}
		return result.data;
	}
}
