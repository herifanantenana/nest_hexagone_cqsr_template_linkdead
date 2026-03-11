import { BusinessLogicException } from "@apk_shared/exceptions/business-logic.exception";

export class EmailAlreadyInUseRegisterException extends BusinessLogicException {
	constructor(email: string) {
		const message = `The email "${email}" is already in use.`;
		const details = { email, reasons: "The email is already registered in the system." };
		super(message, 409, details);
	}
}

export class InvalidRegistrationTokenException extends BusinessLogicException {
	constructor() {
		const message = `The registration token is invalid or has expired.`;
		const details = {
			reasons: "The provided registration token does not match any active registration or has expired.",
		};
		super(message, 400, details);
	}
}

export class RegistrationTokenCooldownExpiredException extends BusinessLogicException {
	constructor() {
		const message = "Invalid registration token. Please request a new registration.";
		const details = {
			reasons: "The provided registration token has expired. Please request a new registration.",
		};
		super(message, 400, details);
	}
}

export class InvalidCredentialsException extends BusinessLogicException {
	constructor() {
		const message = "Invalid email or password.";
		const details = {
			reasons: "The provided email does not exist or the password is incorrect.",
		};
		super(message, 401, details);
	}
}
