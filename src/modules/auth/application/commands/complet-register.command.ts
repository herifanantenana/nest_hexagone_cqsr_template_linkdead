import authEnvConfig from "@apk_common/config/auth-env.config";
import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { InvalidRegistrationTokenException } from "@apk_modules/auth/domain/errors/auth-business.error";
import { type IUnitOfWorkPort, UNIT_OF_WORK } from "@apk_shared/ports/unit-of-work.port";
import { Inject } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AuthValidatorService } from "../../domain/services/auth-validator.service";
import { AccountsAuthPort } from "../ports/accounts-auth.port";
import { ActorsAuthPort } from "../ports/actors-auth.port";
import { PasswordHasherPort } from "../ports/password-hasher.port";
import { RegisterCooldownPort } from "../ports/register-cooldown.port";
import { RegistrationsAuthPort } from "../ports/registration-auth.port";
import { SessionsAuthPort } from "../ports/sessions-auth.port";
import { TokenHasherPort } from "../ports/token-hasher.port";
import { TokenizerPort } from "../ports/tokenizer.port";
import { UsersAuthPort } from "../ports/users-auth.port";

export class CompleteRegisterCommand {
	constructor(
		public readonly token: string,
		public readonly firstName: string,
		public readonly lastName: string,
		public readonly password: string,
		public readonly userAgent: string,
		public readonly ipAddress: string,
	) {}
}

export interface ICompleteRegisterCommandResult {
	userId: string;
	accountId: string;
	actorId: string;
	sessionId: string;
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

@CommandHandler(CompleteRegisterCommand)
export class CompleteRegisterCommandHandler implements ICommandHandler<
	CompleteRegisterCommand,
	ICompleteRegisterCommandResult
> {
	private readonly logger: AppLogger;
	private readonly authValidatorService = new AuthValidatorService();

	constructor(
		private readonly appLogger: AppLogger,
		private readonly tokenHasherPort: TokenHasherPort,
		@Inject(authEnvConfig.KEY) private readonly authConfig: ConfigType<typeof authEnvConfig>,
		private readonly registrationsAuthPort: RegistrationsAuthPort,
		private readonly passwordHasherPort: PasswordHasherPort,
		@Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWorkPort,
		private readonly usersAuthPort: UsersAuthPort,
		private readonly accountsAuthPort: AccountsAuthPort,
		private readonly actorsAuthPort: ActorsAuthPort,
		private readonly tokenizerPort: TokenizerPort,
		private readonly sessionsAuthPort: SessionsAuthPort,
		private readonly registerCooldownPort: RegisterCooldownPort,
	) {
		this.logger = appLogger.withContext(CompleteRegisterCommandHandler.name);
	}

	async execute(command: CompleteRegisterCommand): Promise<ICompleteRegisterCommandResult> {
		const { token, firstName, lastName, password, userAgent, ipAddress } = command;

		// validate input
		this.authValidatorService.validateName(firstName);
		this.authValidatorService.validateName(lastName);
		this.authValidatorService.validatePassword(password);

		// fetch the email associated with the token
		const tokenHash = await this.tokenHasherPort.hashFromSecret(token, this.authConfig.registrationTokenSecret);
		this.logger.debug(
			`Handling CompleteRegisterCommand: tokenHash: ${tokenHash}, firstName: ${firstName}, lastName: ${lastName}`,
		);

		const registration = await this.registrationsAuthPort.findByTokenHash(tokenHash);
		if (!registration) throw new InvalidRegistrationTokenException();

		const cooldownToken = await this.registerCooldownPort.getCooldownToken(registration.email);
		if (!cooldownToken || cooldownToken !== token) throw new InvalidRegistrationTokenException();

		const passwordHash = await this.passwordHasherPort.hash(password);
		const deviceId = this.tokenHasherPort.generateRandomToken(16);

		return this.unitOfWork.withTransaction(async (tx) => {
			// create the user
			const user = await this.usersAuthPort.create({ email: registration.email, firstName, lastName }, tx);
			// create the account
			const account = await this.accountsAuthPort.create({ userId: user.id, passwordHash }, tx);
			// create the actor
			const actor = await this.actorsAuthPort.create(user.id, tx);
			// generate refreshToken
			const { value: refreshToken, expiresAt: refreshTokenExpiresAt } =
				await this.tokenizerPort.generateRefreshToken(deviceId);
			const refreshTokenHash = await this.passwordHasherPort.hash(refreshToken);
			// create sessions
			const session = await this.sessionsAuthPort.create(
				{
					userId: user.id,
					accountId: account.id,
					actorId: actor.id,
					refreshTokenHash,
					userAgent,
					ipAddress,
					deviceId,
					expiresAt: refreshTokenExpiresAt,
				},
				tx,
			);
			// generate accessToken
			const { value: accessToken, expiresAt: accessTokenExpiresAt } = await this.tokenizerPort.generateAccessToken({
				actorId: actor.id,
				userId: user.id,
				accountId: account.id,
				sessionId: session.id,
			});
			// delete the registration entry
			await this.registrationsAuthPort.deleteById(registration.id, tx);
			// delete the cooldown
			await this.registerCooldownPort.delete(registration.email);
			return {
				userId: user.id,
				accountId: account.id,
				actorId: actor.id,
				sessionId: session.id,
				accessToken,
				accessTokenExpiresAt,
				refreshToken,
				refreshTokenExpiresAt,
			};
		});
	}
}
