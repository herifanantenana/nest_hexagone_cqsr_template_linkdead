import { AuthPublic } from "@apk_modules/auth/interface/http/guards/auth.decorators";
import { IDomainItem } from "@apk_modules/taxonomy/application/ports/domains-repo.port";
import { ListDomainsQuery } from "@apk_modules/taxonomy/application/queries/list-domains.query";
import {
	IListGlobalSkillsQueryResult,
	ListGlobalSkillsQuery,
} from "@apk_modules/taxonomy/application/queries/list-global-skills.query";
import { Controller, Get } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

@Controller("taxonomy")
export class TaxonomyController {
	constructor(private readonly queryBus: QueryBus) {}

	@AuthPublic()
	@Get("domains")
	async listDomains() {
		const result: IDomainItem[] = await this.queryBus.execute(new ListDomainsQuery());
		return result;
	}

	@AuthPublic()
	@Get("skills/global")
	async listGlobalSkills() {
		const result: IListGlobalSkillsQueryResult[] = await this.queryBus.execute(new ListGlobalSkillsQuery());
		return result;
	}
}
