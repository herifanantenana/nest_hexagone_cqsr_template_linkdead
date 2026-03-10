import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class VerifyTokenRegisterRequestDto {
	@ApiProperty({ example: "example-token" })
	@IsString({ message: "Invalid token" })
	@MinLength(32, { message: "Invalid token" })
	token: string;
}
