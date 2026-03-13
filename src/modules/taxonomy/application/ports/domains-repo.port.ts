export interface IDomainItem {
	id: string;
	name: string;
}

export abstract class DomainsRepoPort {
	abstract listDomains(): Promise<IDomainItem[]>;
}
