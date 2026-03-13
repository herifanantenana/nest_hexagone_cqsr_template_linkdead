import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class RequestRegisterDto {
	@ApiProperty({ example: "herifanantenana17@gmail.com" })
	@Transform(({ value }) => (typeof value === "string" ? value.toLowerCase().trim() : undefined))
	@IsEmail({}, { message: "Invalid email address" })
	email: string;
}
