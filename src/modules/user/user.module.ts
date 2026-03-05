import { InfraModule } from "@apk_common/infra/infra.module";
import { UsersAuthPort } from "@apk_modules/auth/application/ports/users-auth.port";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { UserAuthDrizzleAdapter } from "./infra/adapters/user-auth.drizzle.adapter";

const adapters = [{ provide: UsersAuthPort, useClass: UserAuthDrizzleAdapter }];

@Module({
	imports: [CqrsModule, InfraModule],
	providers: [...adapters],
	exports: [...adapters],
})
export class UserModule {}
