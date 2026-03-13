import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DomainReadPort } from "./application/ports/domain-read.port";
import { ListDomainsQueryHandler } from "./application/queries/list-domains.query";
import { DomainReadDrizzleAdapter } from "./infra/adapters/domain-read.drizzle.adapter";
import { TaxonomyController } from "./interface/http/controllers/taxonomy.controller";

const adapters = [{ provide: DomainReadPort, useClass: DomainReadDrizzleAdapter }];

const queries = [ListDomainsQueryHandler];

@Module({
	imports: [CqrsModule],
	providers: [...adapters, ...queries],
	controllers: [TaxonomyController],
})
export class TaxonomyModule {}
