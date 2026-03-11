import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
export class LoginDto {
	@ApiProperty({ example: "herifanantenana17@gmail.com" })
	@Transform(({ value }) => (typeof value === "string" ? value.toLowerCase().trim() : undefined))
	@IsEmail({}, { message: "Invalid email address format" })
	email: string;

	@ApiProperty({ example: "Strong/password123", minLength: 1, maxLength: 255 })
	@IsString({ message: "Password is required" })
	@IsNotEmpty({ message: "Password must not be empty" })
	password: string;
}
