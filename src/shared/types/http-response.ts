interface IHttpBaseResponse {
	success: boolean;
	status: number;
	message: string;
	requestId: string;
	timestamp: string;
	path: string;
}
interface IHttpErrorFormatted {
	error: string;
	errorMessage: string;
	details?: unknown;
}

export interface IHttpErrorResponse extends IHttpBaseResponse, IHttpErrorFormatted {}

export interface IHttpSuccessResponse<T, M = unknown> extends IHttpBaseResponse {
	data: T;
	metadata?: M;
}
