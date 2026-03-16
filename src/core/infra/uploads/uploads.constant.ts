import { join } from "path";

export const UPLOADS_ROOT_DIR = join(process.cwd(), "uploads");

export const UPLOADS_DIRS = {
	exploits: {
		images: join(UPLOADS_ROOT_DIR, "exploits", "images"),
		videos: join(UPLOADS_ROOT_DIR, "exploits", "videos"),
		documents: join(UPLOADS_ROOT_DIR, "exploits", "documents"),
	},
} as const;

export const UPLOADS_SERVER_ROOT_DIR = "/public";
