import { PasswordHasherPort } from "@apk_modules/auth/application/ports/password-hasher.port";
import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcrypt";

@Injectable()
export class PasswordHasherBcryptAdapter implements PasswordHasherPort {
	private readonly salt = 10;

	async hash(password: string): Promise<string> {
		return await hash(password, this.salt);
	}

	async compare(password: string, hash: string): Promise<boolean> {
		return await compare(password, hash);
	}
}
