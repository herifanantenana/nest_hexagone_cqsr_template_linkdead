import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DomainsRepoPort } from "./application/ports/domains-repo.port";
import { SkillsRepoPort } from "./application/ports/skills-repo.port";
import { TaxonomiesMixtRepoPort } from "./application/ports/taxonomies-mixt-repo.port";
import { GetDomainTaxonomiesQueryHandler } from "./application/queries/get-domain-taxonomies.query";
import { ListDomainsQueryHandler } from "./application/queries/list-domains.query";
import { ListGlobalSkillsQueryHandler } from "./application/queries/list-global-skills.query";
import { DomainsRepoDrizzleAdapter } from "./infra/adapters/domains-repo.drizzle.adapter";
import { SkillsRepoDrizzleAdapter } from "./infra/adapters/skills-repo.drizzle.adapter.port";
import { TaxonomiesMixtRepoDrizzleAdapter } from "./infra/adapters/taxonomies-mixt-repo.drizzle.adapter";
import { TaxonomyController } from "./interface/http/controllers/taxonomy.controller";

const adapters = [
	{ provide: DomainsRepoPort, useClass: DomainsRepoDrizzleAdapter },
	{ provide: SkillsRepoPort, useClass: SkillsRepoDrizzleAdapter },
	{ provide: TaxonomiesMixtRepoPort, useClass: TaxonomiesMixtRepoDrizzleAdapter },
];

const queries = [ListDomainsQueryHandler, ListGlobalSkillsQueryHandler, GetDomainTaxonomiesQueryHandler];

@Module({
	imports: [CqrsModule],
	providers: [...adapters, ...queries],
	controllers: [TaxonomyController],
})
export class TaxonomyModule {}
