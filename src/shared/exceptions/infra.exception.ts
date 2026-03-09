import { THttpErrorDetails } from "@apk_shared/types/http-response";

export class InfraException extends Error {
	constructor(
		readonly message: string,
		readonly statusCode: number = 500,
		readonly code: string = "INFRA_ERROR",
		readonly details?: THttpErrorDetails,
		readonly publicMessage: string = "An infrastructure error occurred",
	) {
		super(message, { cause: details });
		this.name = this.constructor.name;
	}
}
