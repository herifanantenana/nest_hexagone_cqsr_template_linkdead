import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";

export class VerifyTokenRegisterCommand {
	constructor(
		public readonly email: string,
		public readonly token: string,
	) {}
}

export interface IVerifyTokenRegisterCommandResult {
	statusCode: number;
	message: string;
}

@CommandHandler(VerifyTokenRegisterCommand)
export class VerifyTokenRegisterCommandHandler implements ICommandHandler<
	VerifyTokenRegisterCommand,
	IVerifyTokenRegisterCommandResult
> {
	private readonly logger: AppLogger;
	constructor(
		private readonly appLogger: AppLogger,
		private readonly registerCooldownPort: RegisterCooldownPort,
	) {
		this.logger = appLogger.withContext(VerifyTokenRegisterCommandHandler.name);
	}

	async execute(command: VerifyTokenRegisterCommand): Promise<IVerifyTokenRegisterCommandResult> {
		const { email, token } = command;
		this.logger.debug(`Handling VerifyTokenRegisterCommand: email: ${email}`);

		// check cooldown in Redis
		if (!(await this.registerCooldownPort.isOnCooldown(email))) {
			this.logger.warn(`No active cooldown for email ${email}. Cannot verify registration token.`);
			return {
				statusCode: 400,
				message: "No active registration request found for this email.",
			};
		}

		const storedToken = await this.registerCooldownPort.getCooldownToken(email);
		if (storedToken !== token) {
			this.logger.warn(`Invalid registration token for email ${email}.`);
			return {
				statusCode: 400,
				message: "Invalid registration token.",
			};
		}

		// token is valid, proceed with registration flow (not implemented here)
		this.logger.debug(`Registration token verified successfully for email ${email}.`);
		return {
			statusCode: 200,
			message: "Registration token verified successfully.",
		};
	}
}
