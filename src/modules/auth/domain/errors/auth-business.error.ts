import { BusinessLogicError } from "@apk_shared/errors/business-logic.error";

export class EmailAlreadyInUseRegisterException extends BusinessLogicError {
	constructor(email: string) {
		const message = `The email "${email}" is already in use.`;
		const details = { email, reasons: "The email is already registered in the system." };
		super(message, 409, details);
	}
}
