import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { DomainReadPort } from "../ports/domain-read.port";

export class ListDomainsQuery {}

export interface IListDomainsQueryResult {
	id: string;
	name: string;
}

@QueryHandler(ListDomainsQuery)
export class ListDomainsQueryHandler implements IQueryHandler<ListDomainsQuery, IListDomainsQueryResult[]> {
	constructor(private readonly domainReadPort: DomainReadPort) {}

	async execute(): Promise<IListDomainsQueryResult[]> {
		const domains = await this.domainReadPort.listDomains();
		return domains.map((domain) => ({
			id: domain.id,
			name: domain.name,
		}));
	}
}
