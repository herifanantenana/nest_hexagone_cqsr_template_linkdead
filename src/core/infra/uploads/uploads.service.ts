import { serverConfig } from "@apk_core/config";
import { type TServerConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { isArray } from "@apk_shared/types/utils";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Request } from "express";
import fs from "fs";
import { relative } from "path";
import { UPLOADS_ROOT_DIR, UPLOADS_SERVER_ROOT_DIR } from "./uploads.constant";
import { TUploadedFieldMap, TUploadRulesMap } from "./uploads.types";

@Injectable()
export class UploadsService {
	constructor(
		private readonly logger: AppLogger,
		@Inject(serverConfig.KEY) private readonly serverCfg: TServerConfig,
	) {
		this.logger = this.logger.withContext(UploadsService.name);
	}

	// convert absolute file path to relative path from uploads root dir
	toRelativePath(absolutePath: string): string {
		return relative(UPLOADS_ROOT_DIR, absolutePath).replace(/\\/g, "/");
	}

	// build url for upload to public
	buildPublicFileUrl(relativePath: string): string {
		const normalizedBaseUrl = this.serverCfg.publicBaseUrl.replace(/\/+$/, "");
		const normalizerServerRootDir = UPLOADS_SERVER_ROOT_DIR.startsWith("/")
			? UPLOADS_SERVER_ROOT_DIR
			: `/${UPLOADS_SERVER_ROOT_DIR}`;
		const normalizedRelativePath = relativePath.replace(/^\/+/, "");
		const normalizedGlobalPrefix = this.serverCfg.apiPathPrefix.replace(/\/+$/, "");
		return `${normalizedBaseUrl}/${normalizedGlobalPrefix}${normalizerServerRootDir}/${normalizedRelativePath}`;
	}

	// delete file if exists, log error if deletion fails but do not throw
	async deleteFile(filePath: string): Promise<void> {
		try {
			await fs.promises.unlink(filePath);
		} catch (error) {
			if (error && typeof error === "object" && (error as NodeJS.ErrnoException).code === "ENOENT") {
				return;
			}
			this.logger.error(
				`Failed to delete file at path "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	async deleteFiles(filePaths: string[]): Promise<void> {
		await Promise.all(filePaths.map((path) => this.deleteFile(path)));
	}

	validateFilesByRules(files: Express.Multer.File[], rules: TUploadRulesMap): void {
		files.forEach((file) => {
			const rule = rules[file.fieldname];
			if (!rule) {
				throw new BadRequestException(`Unsupported upload field "${file.fieldname}"`);
			}

			if (file.size > rule.maxSizeInBytes) {
				throw new BadRequestException(
					`File "${file.originalname}" exceeds the maximum allowed size of ${rule.maxSizeInBytes} bytes for field "${file.fieldname}"`,
				);
			}
		});
	}

	extractPathFromSingle(file: Express.Multer.File | undefined): string[] {
		return file ? [file.path] : [];
	}

	extractPathsFromMultiple(files: Express.Multer.File[] | undefined): string[] {
		return files ? files.map((file) => file.path) : [];
	}

	extractPathsFromFields(files: TUploadedFieldMap): string[] {
		if (!files) return [];

		const filePaths: string[] = [];
		for (const fieldFiles of Object.values(files)) {
			if (!fieldFiles) continue;
			for (const file of fieldFiles) {
				if (file.path) {
					filePaths.push(file.path);
				}
			}
		}
		return filePaths;
	}

	extractPathsFromRequest(request: Request): string[] {
		const filePaths: string[] = [];
		// Handle single file upload (e.g., request.file)
		if (request.file?.path) {
			filePaths.push(request.file.path);
		}

		// Handle multiple files upload
		if (isArray(request.files)) {
			for (const file of request.files) {
				if (file.path) {
					filePaths.push(file.path);
				}
			}
		}
		// Handle fields upload
		else if (request.files && typeof request.files === "object") {
			for (const fieldFiles of Object.values(request.files)) {
				if (!fieldFiles) continue;
				for (const file of fieldFiles) {
					if (file.path) {
						filePaths.push(file.path);
					}
				}
			}
		}
		return filePaths;
	}
}
