import { AppThrottlerGuard } from "@apk_core/interface/http/guards/rate-limiter/app-throttler.guard";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerAdapterModule } from "./adapters/throttler-adapter.module";
import { ThrottlerAdapter } from "./adapters/throttler.adapter";

@Module({
	imports: [
		ThrottlerModule.forRootAsync({
			imports: [ThrottlerAdapterModule],
			inject: [ThrottlerAdapter],
			useFactory: (throttlerAdapter: ThrottlerAdapter) => throttlerAdapter.buildThrottlers(),
		}),
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AppThrottlerGuard,
		},
	],
	exports: [ThrottlerModule],
})
export class RateLimitModule {}
