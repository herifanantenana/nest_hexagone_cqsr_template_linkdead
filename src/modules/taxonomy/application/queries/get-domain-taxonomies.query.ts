import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { TaxonomiesMixtRepoPort } from "../ports/taxonomies-mixt-repo.port";

export class GetDomainTaxonomiesQuery {
	constructor(public readonly domainId: string) {}
}

export interface IGetDomainTaxonomiesQueryResult {
	domain: {
		id: string;
		name: string;
		slug: string;
	};
	categories: {
		id: string;
		name: string;
		slug: string;
		domainId: string;
	}[];
	domainsSkills: {
		domainId: string;
		id: string;
		name: string;
		slug: string;
		type: string;
		isGlobal: boolean;
	}[];
	categoriesSkills: {
		categoryId: string;
		id: string;
		name: string;
		slug: string;
		type: string;
		isGlobal: boolean;
	}[];
}

@QueryHandler(GetDomainTaxonomiesQuery)
export class GetDomainTaxonomiesQueryHandler implements IQueryHandler<
	GetDomainTaxonomiesQuery,
	IGetDomainTaxonomiesQueryResult
> {
	constructor(private readonly taxonomiesMixtRepo: TaxonomiesMixtRepoPort) {}

	async execute(query: GetDomainTaxonomiesQuery): Promise<IGetDomainTaxonomiesQueryResult> {
		const { domainId } = query;
		const domainTaxonomies = await this.taxonomiesMixtRepo.getDomainTaxonomies(domainId);

		return {
			domain: domainTaxonomies.domain,
			categories: domainTaxonomies.categories,
			domainsSkills: domainTaxonomies.domainsSkills,
			categoriesSkills: domainTaxonomies.categoriesSkills,
		};
	}
}
