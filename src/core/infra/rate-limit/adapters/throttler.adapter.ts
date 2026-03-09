import { type TRateLimiterConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { RedisService } from "@apk_infra/redis/redis.service";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Inject, Injectable } from "@nestjs/common";
import { rateLimiterConfig } from "./../../../config/root.config";

export const THROTTLER_REGISTER_REQUEST = "THROTTLER_REGISTER_REQUEST";

@Injectable()
export class ThrottlerAdapter {
	constructor(
		private readonly logger: AppLogger,
		private readonly redisService: RedisService,
		@Inject(rateLimiterConfig.KEY) private readonly rateLimiterCfg: TRateLimiterConfig,
	) {
		this.logger.setContext(this.rateLimiterCfg.engine);
	}

	public buildThrottlers() {
		const throttlers: Array<{
			name: string;
			ttl: number;
			limit: number;
		}> = [];

		throttlers.push({
			name: THROTTLER_REGISTER_REQUEST,
			ttl: this.rateLimiterCfg.registerRequest.ttlSec,
			limit: this.rateLimiterCfg.registerRequest.limit,
		});

		return { throttlers, storage: new ThrottlerStorageRedisService(this.redisService.getClient()) };
	}
}
