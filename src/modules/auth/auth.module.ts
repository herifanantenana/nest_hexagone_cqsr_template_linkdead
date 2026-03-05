import { InfraModule } from "@apk_common/infra/infra.module";
import { UserModule } from "@apk_modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RequestRegisterCommandHandler } from "./application/commands/request-register.command";
import { HasherBrutPort } from "./application/ports/hasher-brut.port";
import { RedisAuthPort } from "./application/ports/redis-auth.port";
import { RegistrationsAuthPort } from "./application/ports/registration-auth.port";
import { HasherBrutCryptoAdapter } from "./infra/adapters/hasher.crypto.adapter";
import { RedisAuthRedisAdapter } from "./infra/adapters/redis-auth.redis.adapter";
import { RegistrationsAuthDrizzleAdapter } from "./infra/adapters/registrations-auth.drizzle.adapter";
import { AuthController } from "./interface/http/controllers/auth.controller";

const adapters = [
	{ provide: RedisAuthPort, useClass: RedisAuthRedisAdapter },
	{
		provide: RegistrationsAuthPort,
		useClass: RegistrationsAuthDrizzleAdapter,
	},
	{
		provide: HasherBrutPort,
		useClass: HasherBrutCryptoAdapter,
	},
];

const commands = [RequestRegisterCommandHandler];

@Module({
	imports: [CqrsModule, InfraModule, UserModule],
	providers: [...adapters, ...commands],
	controllers: [AuthController],
})
export class AuthModule {}
