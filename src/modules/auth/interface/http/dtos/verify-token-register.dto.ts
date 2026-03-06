import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class VerifyTokenRegisterRequestDto {
	@ApiProperty({ example: "herifanantenana17@gmail.com" })
	@IsEmail({}, { message: "Invalid email address" })
	email: string;
	@ApiProperty({ example: "example-token" })
	@IsString({ message: "Invalid token" })
	token: string;
}
