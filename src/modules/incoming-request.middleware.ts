import { AppLogger } from "@apk_infra/logger/logger.service";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class IncomingRequestMiddleware implements NestMiddleware {
	constructor(private readonly logger: AppLogger) {
		this.logger = logger.withContext(IncomingRequestMiddleware.name);
	}
	use(request: Request, response: Response, next: NextFunction) {
		const rawRequestId = request.headers["x-request-id"];
		let requestId: string;

		if (Array.isArray(rawRequestId)) requestId = rawRequestId[0] || randomUUID();
		else if (typeof rawRequestId === "string" && rawRequestId.length > 0) requestId = rawRequestId;
		else requestId = randomUUID();

		request.headers["x-request-id"] = requestId;
		request.requestId = requestId;
		request.startTimeMs = Date.now();
		request.isLogged = false;
		response.isLogged = false;
		this.logger.debug(" --------- New request --------- ");
		next();
	}
}
