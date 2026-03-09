import { HttpErrorDetails } from "@apk_shared/types/http-response";

export class BusinessLogicException extends Error {
	constructor(
		readonly message: string,
		readonly statusCode: number,
		readonly details?: HttpErrorDetails,
	) {
		super(message, { cause: details });
		this.name = this.constructor.name;
	}
}
