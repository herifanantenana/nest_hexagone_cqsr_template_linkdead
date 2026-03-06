import { InfraModule } from "@apk_common/infra/infra.module";
import { UserModule } from "@apk_modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RequestRegisterCommandHandler } from "./application/commands/request-register.command";
import { VerifyTokenRegisterCommandHandler } from "./application/commands/verify-token-register.command";
import { RegisterCooldownPort } from "./application/ports/register-cooldown.port";
import { RegistrationsAuthPort } from "./application/ports/registration-auth.port";
import { TokenHasherPort } from "./application/ports/token-hasher.port";
import { RegisterCooldownRedisAdapter } from "./infra/adapters/register-cooldown.redis.adapter";
import { RegistrationsAuthDrizzleAdapter } from "./infra/adapters/registrations-auth.drizzle.adapter";
import { TokenHasherCryptoAdapter } from "./infra/adapters/token-hasher.crypto.adapter";
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
];

const commands = [RequestRegisterCommandHandler, VerifyTokenRegisterCommandHandler];

@Module({
	imports: [CqrsModule, InfraModule, UserModule],
	providers: [...adapters, ...commands],
	controllers: [AuthController],
})
export class AuthModule {}
