import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";

export class EmailAlreadyInUseRegisterException extends BusinessLogicError {
	constructor(email: string) {
		const message = `The email "${email}" is already in use.`;
		const details = { email, reasons: "The email is already registered in the system." };
		super(message, 409, details);
	}
}

export class InvalidRegistrationTokenException extends BusinessLogicError {
	constructor() {
		const message = `The registration token is invalid or has expired.`;
		const details = {
			reasons: "The provided registration token does not match any active registration or has expired.",
		};
		super(message, 400, details);
	}
}
