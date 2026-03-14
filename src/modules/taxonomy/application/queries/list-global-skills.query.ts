import { ESkillTypes } from "@apk_infra/database/schemas/database.type";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { SkillsRepoPort } from "../ports/skills-repo.port";

export class ListGlobalSkillsQuery {}

export interface IListGlobalSkillsQueryResult {
	id: string;
	name: string;
	slug: string;
	type: ESkillTypes;
	isGlobal: boolean;
}

@QueryHandler(ListGlobalSkillsQuery)
export class ListGlobalSkillsQueryHandler implements IQueryHandler<
	ListGlobalSkillsQuery,
	IListGlobalSkillsQueryResult[]
> {
	constructor(private readonly skillsRepoPort: SkillsRepoPort) {}
	async execute(): Promise<IListGlobalSkillsQueryResult[]> {
		const globalSkills = await this.skillsRepoPort.listGlobalSkills();
		return globalSkills.map((skill) => ({
			id: skill.id,
			name: skill.name,
			slug: skill.slug,
			type: skill.type as ESkillTypes,
			isGlobal: skill.isGlobal,
		}));
	}
}
