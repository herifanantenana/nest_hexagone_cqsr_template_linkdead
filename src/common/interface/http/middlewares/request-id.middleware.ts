import { AppLogger } from "@apk_common/infra/logger/logger.service";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
	constructor(private readonly logger: AppLogger) {
		this.logger = logger.withContext(RequestIdMiddleware.name);
	}

	use(request: Request, response: Response, next: NextFunction) {
		const rawRequestId = request.headers["x-request-id"];
		let requestId: string;

		if (Array.isArray(rawRequestId)) requestId = rawRequestId[0] || randomUUID();
		else if (typeof rawRequestId === "string" && rawRequestId.length > 0) requestId = rawRequestId;
		else requestId = randomUUID();

		request.headers["x-request-id"] = requestId;
		request.requestId = requestId;
		this.logger.debug(" --------- New request --------- ");
		next();
	}
}
