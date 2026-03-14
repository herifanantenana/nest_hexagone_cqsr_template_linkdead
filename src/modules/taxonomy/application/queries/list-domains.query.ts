import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { DomainsRepoPort } from "../ports/domains-repo.port";

export class ListDomainsQuery {}

export interface IListDomainsQueryResult {
	id: string;
	name: string;
	slug: string;
}

@QueryHandler(ListDomainsQuery)
export class ListDomainsQueryHandler implements IQueryHandler<ListDomainsQuery, IListDomainsQueryResult[]> {
	constructor(private readonly domainsRepoPort: DomainsRepoPort) {}

	async execute(): Promise<IListDomainsQueryResult[]> {
		const domains = await this.domainsRepoPort.listDomains();
		return domains.map((domain) => ({
			id: domain.id,
			name: domain.name,
			slug: domain.slug,
		}));
	}
}
