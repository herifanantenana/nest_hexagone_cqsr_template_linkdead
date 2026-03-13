import { AuthPublic } from "@apk_modules/auth/interface/http/guards/auth.decorators";
import { IDomainItem } from "@apk_modules/taxonomy/application/ports/domain-read.port";
import { ListDomainsQuery } from "@apk_modules/taxonomy/application/queries/list-domains.query";
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
}
