import { ActorsRepoAuthPort } from "@apk_modules/auth/application/ports/actors-repo-auth.port";
import { UsersRepoAuthPort } from "@apk_modules/auth/application/ports/users-repo-auth.port";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ActorsRepoAuthDrizzleAdapter } from "./infra/adapters/actors-repo-auth.drizzle.adapter";
import { UsersRepoAuthDrizzleAdapter } from "./infra/adapters/users-repo-auth.drizzle.adapter";

const adapters = [
	{ provide: UsersRepoAuthPort, useClass: UsersRepoAuthDrizzleAdapter },
	{ provide: ActorsRepoAuthPort, useClass: ActorsRepoAuthDrizzleAdapter },
];

@Module({
	imports: [CqrsModule],
	providers: [...adapters],
	exports: [UsersRepoAuthPort],
})
export class UserModule {}
