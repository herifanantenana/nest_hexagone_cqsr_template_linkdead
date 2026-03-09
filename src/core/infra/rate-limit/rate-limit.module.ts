import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
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
			useClass: ThrottlerGuard,
		},
	],
	exports: [ThrottlerModule],
})
export class RateLimitModule {}
