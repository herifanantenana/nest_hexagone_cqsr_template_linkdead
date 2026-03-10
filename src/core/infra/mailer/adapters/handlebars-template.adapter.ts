import { mailerConfig, type TMailerConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";
@Injectable()
export class HandlebarsTemplateAdapter implements OnModuleInit {
	private readonly cachedTemplates: Map<string, handlebars.TemplateDelegate> = new Map();

	constructor(
		private readonly logger: AppLogger,
		@Inject(mailerConfig.KEY) private readonly mailerCfg: TMailerConfig,
	) {
		this.logger = logger.withContext(this.constructor.name);
	}
	onModuleInit() {
		this.registerPartials();
		this.logger.log(`${this.constructor.name} render and partials established`);
	}

	// Register partials on initialization
	private registerPartials() {
		const partialsDir = path.join(this.mailerCfg.templateDir, "partials");
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
		return newTemplate;
	}

	// Render the template with the given context
	public renderTemplate(templateName: string, context: Record<string, unknown>): string {
		const layoutPath = path.join(this.mailerCfg.templateDir, "layouts", "main.hbs");
		const templatePath = path.join(this.mailerCfg.templateDir, `${templateName}.hbs`);

		const layout = this.loadTemplate(layoutPath);
		const template = this.loadTemplate(templatePath);

		const content = template(context);
		return layout({ ...context, body: content });
	}
}
