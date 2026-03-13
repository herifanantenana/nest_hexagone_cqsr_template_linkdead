declare module "express" {
	interface Request {
		requestId: string;
		startTimeMs: number;
		isLogged: boolean;
		auth?: {
			userId: string;
			accountId: string;
			actorId: string;
			sessionId: string;
		};
	}

	interface Response {
		isLogged: boolean;
	}
}
