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

export interface IHttpErrorResponse extends IHttpBaseResponse, IHttpErrorFormatted {}

export interface IHttpSuccessResponse<T, M = unknown> extends IHttpBaseResponse {
	data: T;
	metadata?: M;
}
