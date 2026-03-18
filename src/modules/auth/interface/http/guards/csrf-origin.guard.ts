import { serverConfig, type TServerConfig } from "@apk_core/config/root.config";
import { CanActivate, ForbiddenException, Inject, Injectable, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

function tryParseOrigin(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

@Injectable()
export class CsrfOriginGuard implements CanActivate {
	constructor(@Inject(serverConfig.KEY) private readonly serverCfg: TServerConfig) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>();
		const method = (req.method || "GET").toUpperCase();
		if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

		const originHeader = req.get("origin");
		const refererHeader = req.get("referer");
		if (!originHeader && !refererHeader) return true;

		if (this.serverCfg.allowedCorsOrigins.includes("*")) return true;

		const allowedOrigins = new Set<string>();
		for (const raw of this.serverCfg.allowedCorsOrigins) {
			const parsed = tryParseOrigin(raw);
			if (parsed) allowedOrigins.add(parsed);
		}
		allowedOrigins.add(new URL(this.serverCfg.publicBaseUrl).origin);

		const candidates: string[] = [];
		if (originHeader) candidates.push(originHeader);
		if (refererHeader) candidates.push(refererHeader);

		for (const candidate of candidates) {
			const parsed = tryParseOrigin(candidate);
			if (parsed && allowedOrigins.has(parsed)) return true;
		}

		throw new ForbiddenException("CSRF protection: invalid origin");
	}
}
