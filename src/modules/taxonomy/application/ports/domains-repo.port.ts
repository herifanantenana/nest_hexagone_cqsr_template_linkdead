export interface IDomainItem {
	id: string;
	name: string;
	slug: string;
}

export abstract class DomainsRepoPort {
	abstract listDomains(): Promise<IDomainItem[]>;
}
