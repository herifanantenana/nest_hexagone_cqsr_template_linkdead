declare module "express" {
	interface Request {
		requestId: string;
		startTimeMs: number;
		isLogged: boolean;
	}

	interface Response {
		isLogged: boolean;
	}
}
