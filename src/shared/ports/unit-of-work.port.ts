export const UNIT_OF_WORK = Symbol("UNIT_OF_WORK");

export interface IUnitOfWorkPort {
	withTransaction<T>(work: (tx: unknown) => Promise<T>): Promise<T>;
}
