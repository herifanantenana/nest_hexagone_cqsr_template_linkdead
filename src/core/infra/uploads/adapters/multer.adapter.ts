import { generateSlug } from "@apk_shared/utils/slug";
import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { mkdirSync } from "fs";
import { diskStorage, type FileFilterCallback, type StorageEngine } from "multer";
import { extname } from "path";
import { TUploadRulesMap } from "../uploads.types";

export function createDynamicMulterStorage(rules: TUploadRulesMap): StorageEngine {
	return diskStorage({
		destination: (_req: Request, file: Express.Multer.File, callback) => {
			// set the rule dir based on the field name
			const rule = rules[file.fieldname];
			if (!rule) {
				return callback(new BadRequestException(`Unsupported upload field "${file.fieldname}"`), "");
			}

			mkdirSync(rule.dir, { recursive: true });
			callback(null, rule.dir);
		},
		filename: (req: Request, file: Express.Multer.File, callback) => {
			const userId = req.auth?.userId || "anonymous";
			const ext = extname(file.originalname).toLowerCase();
			const filename = generateSlug(`${userId}-${Date.now()}-${file.originalname.replace(ext, "")}`) + ext;
			callback(null, filename);
		},
	});
}

export function createDynamicMulterFileFilter(rules: TUploadRulesMap) {
	return (_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
		try {
			const rule = rules[file.fieldname];
			if (!rule) {
				throw new BadRequestException(`Unsupported upload field "${file.fieldname}"`);
			}

			const extension = extname(file.originalname).toLowerCase();
			if (!rule.allowedExt.has(extension)) {
				throw new BadRequestException(`File extension "${extension}" is not allowed for field "${file.fieldname}"`);
			}

			if (!rule.allowedMimeTypes.has(file.mimetype)) {
				throw new BadRequestException(`MIME type "${file.mimetype}" is not allowed for field "${file.fieldname}"`);
			}

			callback(null, true);
		} catch (error) {
			callback(error instanceof Error ? error : new BadRequestException(String(error)));
		}
	};
}
