import { UploadsRollbackInterceptor } from "@apk_core/interface/http/interceptors/uploads/uploads-rollback.interceptor";
import { LoggerModule } from "@apk_infra/logger/logger.module";
import { Module } from "@nestjs/common";
import { UploadsSafeAction } from "./uploads-safe-action";
import { UploadsService } from "./uploads.service";

@Module({
	imports: [LoggerModule],
	providers: [UploadsService, UploadsSafeAction, UploadsRollbackInterceptor],
	exports: [UploadsService, UploadsSafeAction, UploadsRollbackInterceptor],
})
export class UploadsModule {}
