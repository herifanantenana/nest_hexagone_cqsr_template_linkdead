import mailerEnvConfig from "@apk_common/config/mailer-env.config";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import fs from "fs";
import * as handlebars from "handlebars";
import path from "path";
import { AppLogger } from "../logger/logger.service";

@Injectable()
export class HandlebarsEngineService implements OnModuleInit {
	// to avoid compiling the same template
	private cachedTemplates = new Map<string, handlebars.TemplateDelegate>();
	private readonly logger: AppLogger;

	constructor(
		private appLogger: AppLogger,
		@Inject(mailerEnvConfig.KEY) private mailerConfig: ConfigType<typeof mailerEnvConfig>,
	) {
		this.logger = this.appLogger.withContext(HandlebarsEngineService.name);
	}

	onModuleInit() {
		this.registerPartials();
		this.logger.log("Handlebars template engine initialized and partials registered");
	}

	// Register partials on initialization
	private registerPartials() {
		const partialsDir = path.join(this.mailerConfig.templateDir, "partials");
		if (!fs.existsSync(partialsDir)) {
			this.logger.warn(`Partials directory does not exist: ${partialsDir}`);
			return;
		}

		for (const file of fs.readdirSync(partialsDir)) {
			if (!file.endsWith(".hbs")) continue;

			const partialName = path.basename(file, ".hbs");
			const partialPath = path.join(partialsDir, file);
			const partialContent = fs.readFileSync(partialPath, "utf-8");
			handlebars.registerPartial(partialName, partialContent);
		}
	}

	// Load and cache templates
	private loadTemplate(path: string) {
		const template = this.cachedTemplates.get(path);
		if (template) return template;

		const newTemplate = handlebars.compile(fs.readFileSync(path, "utf-8"));
		this.cachedTemplates.set(path, newTemplate);
		this.logger.debug(`Loaded and cached template: ${path}`);
		return newTemplate;
	}

	// Render the template with the given context
	public renderTemplate(templateName: string, context: Record<string, unknown>): string {
		const layoutPath = path.join(this.mailerConfig.templateDir, "layouts", "main.hbs");
		const templatePath = path.join(this.mailerConfig.templateDir, `${templateName}.hbs`);

		const layout = this.loadTemplate(layoutPath);
		const template = this.loadTemplate(templatePath);

		const content = template(context);
		return layout({ ...context, body: content });
	}
}
