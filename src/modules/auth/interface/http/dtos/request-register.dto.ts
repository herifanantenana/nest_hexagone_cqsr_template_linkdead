import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class RegisterRequestDto {
	@ApiProperty({ example: "herifanantenana17@gmail.com" })
	@IsEmail({}, { message: "Invalid email address" })
	email: string;
}
