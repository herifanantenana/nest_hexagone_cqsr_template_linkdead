declare module "express" {
	interface Request {
		requestId: string;
		startTimeMs: number;
		isLoggedByInterceptor?: boolean;
	}

	interface Response {
		isLoggedByInterceptor?: boolean;
	}
}
