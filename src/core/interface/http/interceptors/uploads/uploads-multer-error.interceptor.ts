import { isObject, isString } from "@apk_shared/types/utils";
import {
	BadRequestException,
	CallHandler,
	ExecutionContext,
	Injectable,
	mixin,
	NestInterceptor,
	type Type,
} from "@nestjs/common";
import { catchError, Observable, throwError } from "rxjs";

export type TExpectedUploadField = {
	name: string;
	maxCount?: number;
};

export type TUploadsMulterErrorInterceptorOptions = {
	fields: readonly TExpectedUploadField[];
};

function getErrorMessage(error: unknown): string {
	if (isString(error)) return error;
	if (!isObject(error)) return "";
	const message = error["message"];
	return typeof message === "string" ? message : "";
}

function getErrorCode(error: unknown): string | undefined {
	if (!isObject(error)) return undefined;
	const code = error["code"];
	return typeof code === "string" ? code : undefined;
}

function normalizeUploadFieldName(field: string): string {
	return field.replace(/\[\]$/, "").replace(/\[\d+\]$/, "");
}

function allowedFieldNames(fields: readonly TExpectedUploadField[]): string {
	return fields.map((f) => f.name).join(", ");
}

function buildFriendlyUploadError(
	error: unknown,
	options: TUploadsMulterErrorInterceptorOptions,
): BadRequestException | undefined {
	const message = getErrorMessage(error);
	const code = getErrorCode(error);

	if (code === "LIMIT_FILE_SIZE" || /^File too large$/i.test(message)) {
		return new BadRequestException("File too large.");
	}

	if (code === "LIMIT_UNEXPECTED_FILE" || /^Unexpected field/i.test(message)) {
		const dashIndex = message.indexOf("-");
		const raw = dashIndex >= 0 ? message.slice(dashIndex + 1).trim() : undefined;
		if (!raw) {
			return new BadRequestException("Unexpected upload field.");
		}

		const field = raw.replace(/^"|"$/g, "");
		const normalized = normalizeUploadFieldName(field);
		const expected = options.fields.find((f) => f.name === normalized);

		if (normalized !== field && expected) {
			return new BadRequestException(`Invalid upload field "${field}". Use "${normalized}".`);
		}

		if (expected?.maxCount !== undefined) {
			return new BadRequestException(`Too many files for "${normalized}" (max ${expected.maxCount}).`);
		}

		return new BadRequestException(
			`Unexpected upload field "${field}". Allowed fields: ${allowedFieldNames(options.fields)}.`,
		);
	}

	return undefined;
}

export function UploadsMulterErrorInterceptor(options: TUploadsMulterErrorInterceptorOptions): Type<NestInterceptor> {
	@Injectable()
	class UploadsMulterErrorInterceptorMixin implements NestInterceptor {
		intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
			return next.handle().pipe(
				catchError((error: unknown) => {
					const friendly = buildFriendlyUploadError(error, options);
					return throwError(() => friendly ?? error);
				}),
			);
		}
	}

	return mixin(UploadsMulterErrorInterceptorMixin);
}
