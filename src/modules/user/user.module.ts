import { InfraModule } from "@apk_common/infra/infra.module";
import { ActorsAuthPort } from "@apk_modules/auth/application/ports/actors-auth.port";
import { UsersAuthPort } from "@apk_modules/auth/application/ports/users-auth.port";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ActorsAuthDrizzleAdapter } from "./infra/adapters/actors-auth.drizzle.adapter";
import { UserAuthDrizzleAdapter } from "./infra/adapters/user-auth.drizzle.adapter";

const adapters = [
	{ provide: UsersAuthPort, useClass: UserAuthDrizzleAdapter },
	{
		provide: ActorsAuthPort,
		useClass: ActorsAuthDrizzleAdapter,
	},
];

@Module({
	imports: [CqrsModule, InfraModule],
	providers: [...adapters],
	exports: [...adapters],
})
export class UserModule {}
