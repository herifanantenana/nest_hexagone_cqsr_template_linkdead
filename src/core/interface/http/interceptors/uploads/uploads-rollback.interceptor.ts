import { AppLogger } from "@apk_infra/logger/logger.service";
import { UploadsService } from "@apk_infra/uploads/uploads.service";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { catchError, defer, Observable } from "rxjs";

@Injectable()
export class UploadsRollbackInterceptor implements NestInterceptor {
	constructor(
		private readonly logger: AppLogger,
		private readonly uploadsService: UploadsService,
	) {
		this.logger = this.logger.withContext(UploadsRollbackInterceptor.name);
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest<Request>();

		return next.handle().pipe(
			catchError((error: unknown) =>
				defer(async () => {
					// this.logger.error("Error occurred, rolling back uploaded files", {
					// 	error: error instanceof Error ? error.stack || error.message : String(error),
					// });
					const filePaths = this.uploadsService.extractPathsFromRequest(request);
					await this.uploadsService.deleteFiles(filePaths);
					throw error;
				}),
			),
		);
	}
}
