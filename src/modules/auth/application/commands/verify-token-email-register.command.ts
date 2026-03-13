import { AppLogger } from "@apk_infra/logger/logger.service";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RegisterTokenValidatorService } from "../services/register-token-validator.service";

export class VerifyTokenEmailRegisterCommand {
	constructor(public readonly tokenEncrypted: string) {}
}

export interface IVerifyTokenEmailRegisterCommandResult {
	statusCode: number;
	message: string;
}

@CommandHandler(VerifyTokenEmailRegisterCommand)
export class VerifyTokenEmailRegisterCommandHandler implements ICommandHandler<
	VerifyTokenEmailRegisterCommand,
	IVerifyTokenEmailRegisterCommandResult
> {
	constructor(
		private readonly logger: AppLogger,
		private readonly registerTokenValidatorService: RegisterTokenValidatorService,
	) {
		this.logger = this.logger.withContext(VerifyTokenEmailRegisterCommandHandler.name);
	}

	async execute(command: VerifyTokenEmailRegisterCommand): Promise<IVerifyTokenEmailRegisterCommandResult> {
		const { tokenEncrypted } = command;

		await this.registerTokenValidatorService.validate(tokenEncrypted);

		return {
			statusCode: 200,
			message: "Registration token confirmed successfully",
		};
	}
}
