interface IHttpBaseResponse {
	success: boolean;
	status: number;
	message: string;
	requestId: string;
	timestamp: string;
	path: string;
}

export type HttpErrorDetails = Record<string, unknown>;

interface IHttpErrorFormatted {
	error: string;
	errorMessage: string;
	details?: HttpErrorDetails;
}

export type THttpErrorResponse = IHttpBaseResponse & IHttpErrorFormatted;

export type THttpSuccessResponse<T, M = unknown> = IHttpBaseResponse & {
	data: T;
	metadata?: M;
};
