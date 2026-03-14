import { AuthPublic } from "@apk_modules/auth/interface/http/guards/auth.decorators";
import { IDomainItem } from "@apk_modules/taxonomy/application/ports/domains-repo.port";
import {
	GetDomainTaxonomiesQuery,
	IGetDomainTaxonomiesQueryResult,
} from "@apk_modules/taxonomy/application/queries/get-domain-taxonomies.query";
import { ListDomainsQuery } from "@apk_modules/taxonomy/application/queries/list-domains.query";
import {
	IListGlobalSkillsQueryResult,
	ListGlobalSkillsQuery,
} from "@apk_modules/taxonomy/application/queries/list-global-skills.query";
import { Controller, Get, Param } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { ApiOperation } from "@nestjs/swagger";

@Controller("taxonomy")
export class TaxonomyController {
	constructor(private readonly queryBus: QueryBus) {}

	@AuthPublic()
	@Get("domains")
	@ApiOperation({ summary: "List all domains" })
	async listDomains() {
		const result: IDomainItem[] = await this.queryBus.execute(new ListDomainsQuery());
		return result;
	}

	@AuthPublic()
	@Get("skills/global")
	@ApiOperation({ summary: "List all global skills" })
	async listGlobalSkills() {
		const result: IListGlobalSkillsQueryResult[] = await this.queryBus.execute(new ListGlobalSkillsQuery());
		return result;
	}

	@AuthPublic()
	@Get("domains/:domainId/taxonomies")
	@ApiOperation({ summary: "Get taxonomies for a specific domain" })
	async getDomainTaxonomies(@Param("domainId") domainId: string) {
		const result: IGetDomainTaxonomiesQueryResult = await this.queryBus.execute(new GetDomainTaxonomiesQuery(domainId));
		return result;
	}
}
