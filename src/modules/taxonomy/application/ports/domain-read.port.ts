export interface IDomainItem {
	id: string;
	name: string;
}

export abstract class DomainReadPort {
	abstract listDomains(): Promise<IDomainItem[]>;
}
