import { TRateLimitPolicy, type TRateLimiterConfig, rateLimiterConfig } from "@apk_core/config/root.config";
import { AppLogger } from "@apk_infra/logger/logger.service";
import { RedisService } from "@apk_infra/redis/redis.service";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Inject, Injectable } from "@nestjs/common";
import { seconds } from "@nestjs/throttler";

@Injectable()
export class ThrottlerAdapter {
	constructor(
		private readonly logger: AppLogger,
		private readonly redisService: RedisService,
		@Inject(rateLimiterConfig.KEY) private readonly rateLimiterCfg: TRateLimiterConfig,
	) {
		this.logger = logger.withContext(this.rateLimiterCfg.engine);
	}

	public buildThrottlers() {
		const policies: TRateLimitPolicy[] = this.rateLimiterCfg.policies;

		return {
			throttlers: policies.map((policy) => ({
				name: policy.name,
				ttl: seconds(policy.ttlSec),
				limit: policy.limit,
			})),
			storage: new ThrottlerStorageRedisService(this.redisService.getClient()),
		};
	}
}
