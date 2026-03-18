import { OrganizationsRepoAuthPort } from "@apk_modules/auth/application/ports/organizations-repo-auth.port";
import { Module } from "@nestjs/common";
import { OrganizationRepoAuthDrizzleAdapter } from "./infra/adapters/organization-repo-auth.drizzle.adapter";

const adapters = [{ provide: OrganizationsRepoAuthPort, useClass: OrganizationRepoAuthDrizzleAdapter }];

@Module({
	providers: [...adapters],
	exports: [OrganizationsRepoAuthPort],
})
export class OrganizationModule {}
