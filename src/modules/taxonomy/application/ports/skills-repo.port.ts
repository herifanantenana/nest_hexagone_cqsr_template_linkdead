export interface ISkillItem {
	id: string;
	name: string;
	type: string;
	isGlobal: boolean;
}

export abstract class SkillsRepoPort {
	abstract listGlobalSkills(): Promise<ISkillItem[]>;
}
