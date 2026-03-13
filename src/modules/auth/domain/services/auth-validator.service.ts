import {
	InvalidAuthNameException,
	InvalidAuthPasswordException,
	InvalidEmailFormatException,
} from "../exceptions/auth-validation.exception";

export class AuthValidatorService {
	validateEmail(email: string): void {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new InvalidEmailFormatException(email, "Email does not match the required format.");
		}
	}

	validateName(name: string): void {
		const reasons: string[] = [];
		if (name.length < 3 || name.length > 50) {
			reasons.push("Name must be between 3 and 50 characters long.");
		}
		const nameRegex = /^[a-zA-Z0-9_]+$/;
		if (!nameRegex.test(name)) {
			reasons.push("Name must only contain alphanumeric characters and underscores.");
		}
		if (reasons.length > 0) {
			throw new InvalidAuthNameException(name, reasons);
		}
	}

	validatePassword(password: string): void {
		const reasons: string[] = [];
		if (password.length < 8) {
			reasons.push("Password must be at least 8 characters long.");
		}
		const uppercaseRegex = /[A-Z]/;
		if (!uppercaseRegex.test(password)) {
			reasons.push("Password must contain at least one uppercase letter.");
		}
		const lowercaseRegex = /[a-z]/;
		if (!lowercaseRegex.test(password)) {
			reasons.push("Password must contain at least one lowercase letter.");
		}
		const digitRegex = /\d/;
		if (!digitRegex.test(password)) {
			reasons.push("Password must contain at least one digit.");
		}
		const specialCharRegex = /[!@#$%^&*(),.?":{}|/<>]/;
		if (!specialCharRegex.test(password)) {
			reasons.push(`Password must contain at least one special character. ${specialCharRegex.toString()}`);
		}
		if (reasons.length > 0) {
			throw new InvalidAuthPasswordException(reasons);
		}
	}
}
