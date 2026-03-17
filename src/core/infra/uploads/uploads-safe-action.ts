import { Injectable } from "@nestjs/common";
import { UploadsService } from "./uploads.service";

@Injectable()
export class UploadsSafeAction {
	constructor(private readonly uploadsService: UploadsService) {}

	async withRollback<T>(filePaths: string[], action: () => Promise<T>): Promise<T> {
		try {
			return await action();
		} catch (error) {
			await this.uploadsService.deleteFiles(filePaths);
			throw error;
		}
	}
}
