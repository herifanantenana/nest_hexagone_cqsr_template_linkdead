import { ISafeError, ISafeOk, ISafeResponse } from "./safe-response";

export function toSafeOK<T>(value: T): ISafeOk<T> {
	return { ok: true, data: value };
}

export function toSafeError<E extends Error>(error: E): ISafeError<E> {
	return { ok: false, error };
}

export function isSafeOk<T, E extends Error>(response: ISafeResponse<T, E>): response is ISafeOk<T> {
	return response.ok === true;
}

export function isSafeError<T, E extends Error>(response: ISafeResponse<T, E>): response is ISafeError<E> {
	return response.ok === false;
}
