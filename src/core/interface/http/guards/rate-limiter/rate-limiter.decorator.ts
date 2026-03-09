import { SetMetadata } from "@nestjs/common";
import { NO_THROTTLE_KEY, RATE_LIMIT_POLICIES_KEY, type RateLimitPolicyName } from "./rate-limiter.policies";

export function RateLimiter(policies: RateLimitPolicyName | RateLimitPolicyName[]) {
	const names = Array.isArray(policies) ? policies : [policies];
	return SetMetadata(RATE_LIMIT_POLICIES_KEY, names);
}

export function NoThrottle() {
	return SetMetadata(NO_THROTTLE_KEY, true);
}
