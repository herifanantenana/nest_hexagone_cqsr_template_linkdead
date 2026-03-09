import { UsersRepoAuthPort } from "@apk_modules/auth/application/ports/users-repo-auth.port";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { UsersRepoAuthDrizzleAdapter } from "./infra/adapters/users-repo-auth.drizzle.adapter";

const adapters = [{ provide: UsersRepoAuthPort, useClass: UsersRepoAuthDrizzleAdapter }];

@Module({
	imports: [CqrsModule],
	providers: [...adapters],
	exports: [UsersRepoAuthPort],
})
export class UserModule {}
