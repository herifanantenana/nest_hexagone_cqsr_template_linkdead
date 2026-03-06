import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CompleteRegisterDto {
	@ApiProperty({ example: "x0x0x0x0x0x0" })
	@IsString({ message: "Invalid token " })
	token: string;

	@ApiProperty({ example: "rakotomalala", minLength: 3, maxLength: 25 })
	@IsString({ message: "FirstName must be a string" })
	@MinLength(3, { message: "FirstName must be at least 3 characters long" })
	@MaxLength(25, { message: "FirstName must be at most 25 characters long" })
	firstName: string;

	@ApiProperty({ example: "herifanantenana", minLength: 3, maxLength: 25 })
	@IsString({ message: "LastName must be a string" })
	@MinLength(3, { message: "LastName must be at least 3 characters long" })
	@MaxLength(25, { message: "LastName must be at most 25 characters long" })
	lastName: string;

	@ApiProperty({ example: "Strong/password123", minLength: 8, maxLength: 255 })
	@IsString({ message: "Password must be a string" })
	@MinLength(8, { message: "Password must be at least 8 characters long" })
	@MaxLength(255, { message: "Password must be at most 255 characters long" })
	password: string;
}
