import jwtEnvConfig from "@apk_common/config/jwt-env.config";
import { InfraModule } from "@apk_common/infra/infra.module";
import { UserModule } from "@apk_modules/user/user.module";
import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import { CompleteRegisterCommandHandler } from "./application/commands/complet-register.command";
import { RequestRegisterCommandHandler } from "./application/commands/request-register.command";
import { VerifyTokenRegisterCommandHandler } from "./application/commands/verify-token-register.command";
import { AccountsAuthPort } from "./application/ports/accounts-auth.port";
import { PasswordHasherPort } from "./application/ports/password-hasher.port";
import { RegisterCooldownPort } from "./application/ports/register-cooldown.port";
import { RegistrationsAuthPort } from "./application/ports/registration-auth.port";
import { SessionsAuthPort } from "./application/ports/sessions-auth.port";
import { TokenHasherPort } from "./application/ports/token-hasher.port";
import { TokenizerPort } from "./application/ports/tokenizer.port";
import { AccountsAuthDrizzleAdapter } from "./infra/adapters/accounts-auth.drizzle.adapter";
import { PasswordHasherBcryptAdapter } from "./infra/adapters/password-hasher.bcrypt";
import { RegisterCooldownRedisAdapter } from "./infra/adapters/register-cooldown.redis.adapter";
import { RegistrationsAuthDrizzleAdapter } from "./infra/adapters/registrations-auth.drizzle.adapter";
import { SessionsAuthDrizzleAdapter } from "./infra/adapters/sessions-auth.drizzle.aadapter";
import { TokenHasherCryptoAdapter } from "./infra/adapters/token-hasher.crypto.adapter";
import { TokenizerJwtAdapter } from "./infra/adapters/tokenizer.jwt.adapter";
import { AuthController } from "./interface/http/controllers/auth.controller";

const adapters = [
	{ provide: RegisterCooldownPort, useClass: RegisterCooldownRedisAdapter },
	{
		provide: RegistrationsAuthPort,
		useClass: RegistrationsAuthDrizzleAdapter,
	},
	{
		provide: TokenHasherPort,
		useClass: TokenHasherCryptoAdapter,
	},
	{
		provide: PasswordHasherPort,
		useClass: PasswordHasherBcryptAdapter,
	},
	{
		provide: AccountsAuthPort,
		useClass: AccountsAuthDrizzleAdapter,
	},
	{
		provide: TokenizerPort,
		useClass: TokenizerJwtAdapter,
	},
	{
		provide: SessionsAuthPort,
		useClass: SessionsAuthDrizzleAdapter,
	},
];

const commands = [RequestRegisterCommandHandler, VerifyTokenRegisterCommandHandler, CompleteRegisterCommandHandler];

@Module({
	imports: [
		CqrsModule,
		InfraModule,
		UserModule,
		JwtModule.registerAsync({
			inject: [jwtEnvConfig.KEY],
			useFactory: (jwtConfig: ConfigType<typeof jwtEnvConfig>) => ({
				secret: jwtConfig.accessTokenSecret,
				signOptions: { expiresIn: jwtConfig.accessTokenTtlSec },
			}),
		}),
	],
	providers: [...adapters, ...commands],
	controllers: [AuthController],
})
export class AuthModule {}
