import { serverConfig } from "@apk_core/config";
import { type TServerConfig } from "@apk_core/config/root.config";
import { ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
	InjectThrottlerOptions,
	InjectThrottlerStorage,
	ThrottlerGuard,
	ThrottlerStorage,
	type ThrottlerModuleOptions,
	type ThrottlerRequest,
} from "@nestjs/throttler";
import { NO_THROTTLE_KEY, POLICY_GLOBAL, RATE_LIMIT_POLICIES_KEY } from "./rate-limiter.policies";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
	private trustProxy: boolean;

	constructor(
		@InjectThrottlerOptions() options: ThrottlerModuleOptions,
		@InjectThrottlerStorage() storageService: ThrottlerStorage,
		reflector: Reflector,
		@Inject(serverConfig.KEY) private readonly serverCfg: TServerConfig,
	) {
		super(options, storageService, reflector);
		this.trustProxy = this.serverCfg.trustProxy;
	}

	// Allow skipping rate limiting by setting, checked first in canActivate()
	protected shouldSkip(context: ExecutionContext): Promise<boolean> {
		const noThrottle = this.reflector.getAllAndOverride<boolean>(NO_THROTTLE_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		return Promise.resolve(noThrottle === true);
	}

	// Only apply a throttler if its policy is declared on the route. If not declared, skip silently
	protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
		const { context, throttler } = requestProps;

		if (throttler.name === POLICY_GLOBAL) {
			return super.handleRequest(requestProps);
		}

		const activePolicies = this.reflector.getAllAndOverride<string[]>(RATE_LIMIT_POLICIES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!activePolicies?.includes(throttler.name!)) {
			return true; // policy not declared on this route → skip silently
		}

		return super.handleRequest(requestProps);
	}

	// Get the user ID if authenticated, otherwise fallback to IP address (with optional trust proxy support)
	protected getTracker(req: Record<string, any>): Promise<string> {
		const userId = (req.user as { id?: string } | undefined)?.id;
		if (userId) {
			return Promise.resolve(`user:${userId}`);
		}

		let ip: string;
		if (this.trustProxy) {
			const headers = req.headers as Record<string, string | string[] | undefined> | undefined;
			const forwarded = headers?.["x-forwarded-for"];
			if (forwarded) {
				ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]?.trim() || "unknown";
			}
		}

		ip = (req.ip as string) || (req.socket as { remoteAddress?: string })?.remoteAddress || "unknown";
		return Promise.resolve(`ip:${ip}`);
	}

	// Body of the 429 response.
	protected getErrorMessage(): Promise<string> {
		return Promise.resolve("Too many requests. Please try again later.");
	}
}
