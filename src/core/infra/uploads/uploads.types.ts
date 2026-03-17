export type TUploadRule = {
	fieldName: string;
	dir: string;
	allowedExt: ReadonlySet<string>;
	allowedMimeTypes: ReadonlySet<string>;
	maxSizeInBytes: number;
};

export type TUploadRulesMap = Record<string, TUploadRule>;

export type TUploadedFieldMap = Record<string, Express.Multer.File[]>;
