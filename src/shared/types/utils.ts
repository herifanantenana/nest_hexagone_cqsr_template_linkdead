export function isString(value: unknown): value is string {
	return typeof value === "string";
}

export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value);
}

export function hasField(value: unknown, field: string): value is Record<string, unknown> {
	return isObject(value) && field in value;
}

export function getField<T>(value: unknown, field: string): T | undefined {
	if (hasField(value, field)) {
		return value[field] as T;
	}
	return undefined;
}

export function omitField<T>(value: T, field: string): T {
	if (!hasField(value, field)) {
		return value;
	}
	const { [field]: _, ...rest } = value;
	void _;
	return rest as T;
}
