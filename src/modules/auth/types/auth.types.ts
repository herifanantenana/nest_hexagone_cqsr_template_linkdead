export type TJwtAuthPayload = {
	sub: string; // userId
	uid: string; // userId
	acid: string; // accountId
	atid: string; // actorId
	sid: string; // sessionId
};

export type TReqAuthContext = {
	userId: string;
	accountId: string;
	actorId: string;
	sessionId: string;
};
