import { HttpErrorDetails } from "@apk_shared/types/http-response";

export class BusinessLogicError extends Error {
	constructor(
		readonly message: string,
		readonly details?: HttpErrorDetails,
	) {
		super(message, { cause: details });
		this.name = this.constructor.name;
	}
}
