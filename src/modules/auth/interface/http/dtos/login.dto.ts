import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";
export class LoginDto {
	@ApiProperty({ example: "herifanantenana17@gmail.com" })
	@IsEmail({}, { message: "Invalid email address format" })
	email: string;

	@ApiProperty({ example: "Strong/password123", minLength: 1, maxLength: 255 })
	@IsString({ message: "Password is required" })
	password: string;
}
