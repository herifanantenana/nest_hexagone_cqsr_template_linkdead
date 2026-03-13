import { BusinessLogicException } from "@apk_shared/exceptions/business-logic.exception";

export class InvalidEmailFormatException extends BusinessLogicException {
	constructor(email: string, reasons: string | string[]) {
		const message = `Invalid email format for "${email}"`;
		const details = { email, reasons };
		super(message, 400, details);
	}
}

export class InvalidAuthNameException extends BusinessLogicException {
	constructor(name: string, reasons: string | string[]) {
		const message = `The name "${name}" is invalid.`;
		const details = { name, reasons };
		super(message, 400, details);
	}
}

export class InvalidAuthPasswordException extends BusinessLogicException {
	constructor(reasons: string | string[]) {
		const message = `The provided password is invalid.`;
		const details = { reasons };
		super(message, 400, details);
	}
}
