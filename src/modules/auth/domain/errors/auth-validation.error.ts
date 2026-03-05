import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";

export class InvalidEmailFormatException extends BusinessLogicError {
	constructor(email: string, reasons: string | string[]) {
		const message = `Invalid email format for "${email}"`;
		const details = { email, reasons };
		super(message, 400, details);
	}
}
