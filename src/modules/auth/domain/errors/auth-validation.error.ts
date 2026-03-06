import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";

export class InvalidEmailFormatException extends BusinessLogicError {
	constructor(email: string, reasons: string | string[]) {
		const message = `Invalid email format for "${email}"`;
		const details = { email, reasons };
		super(message, 400, details);
	}
}

export class InvalidAuthNameException extends BusinessLogicError {
	constructor(name: string, reasons: string | string[]) {
		const message = `The name "${name}" is invalid.`;
		const details = { name, reasons };
		super(message, 400, details);
	}
}

export class InvalidAuthPasswordException extends BusinessLogicError {
	constructor(reasons: string | string[]) {
		const message = `The provided password is invalid.`;
		const details = { reasons };
		super(message, 400, details);
	}
}
