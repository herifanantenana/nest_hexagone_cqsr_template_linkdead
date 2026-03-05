import { InvalidEmailFormatException } from "../errors/auth-validation.error";

export class AuthValidatorService {
	validateEmail(email: string): void {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new InvalidEmailFormatException(email, "Email does not match the required format.");
		}
	}
}
