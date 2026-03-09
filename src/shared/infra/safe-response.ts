export interface ISafeOk<T> {
	ok: true;
	data: T;
}

export interface ISafeError<E extends Error = Error> {
	ok: false;
	error: E;
}

export type ISafeResponse<T, E extends Error = Error> = ISafeOk<T> | ISafeError<E>;
