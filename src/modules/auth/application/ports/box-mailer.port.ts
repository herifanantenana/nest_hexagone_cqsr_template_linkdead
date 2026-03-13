export abstract class BoxMailerPort {
	abstract sendVerificationRegisterEmail(to: string, token: string): Promise<void>;
}
