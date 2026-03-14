import { IDomainItem } from "./domains-repo.port";

export interface ICategoryDomainItem {
	id: string;
	name: string;
	slug: string;
	domainId: string;
}

export interface ISkillsDomainItem {
	domainId: string;
	id: string;
	name: string;
	slug: string;
	type: string;
	isGlobal: boolean;
}

export interface ICategoriesDomainItem {
	categoryId: string;
	id: string;
	name: string;
	slug: string;
	type: string;
	isGlobal: boolean;
}

export interface IDomainTaxonomies {
	domain: IDomainItem;
	categories: ICategoryDomainItem[];
	domainsSkills: ISkillsDomainItem[];
	categoriesSkills: ICategoriesDomainItem[];
}

export abstract class TaxonomiesMixtRepoPort {
	abstract getDomainTaxonomies(domainId: string): Promise<IDomainTaxonomies>;
}
