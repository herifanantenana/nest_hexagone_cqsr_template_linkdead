import { EActorTypes } from "@apk_infra/database/schemas/database.type";

export type TJwtAuthPayload = {
	sub: string; // userId
	uid: string; // userId
	acid: string; // accountId
	atid: string; // actorId
	sid: string; // sessionId
	ctx: EActorTypes; // actor type context (user or organization)
	oid?: string; // organizationId, only present if actor type is organization
};

export type TReqAuthContext = {
	userId: string;
	accountId: string;
	actorId: string;
	sessionId: string;
	organizationId?: string;
};
