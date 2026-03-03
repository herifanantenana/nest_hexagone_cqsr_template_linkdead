import redisEnvConfig from "@apk_common/config/redis-env.config";
import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

@Global()
@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [redisEnvConfig.KEY],
			useFactory: (redisConfig: ConfigType<typeof redisEnvConfig>) => ({
				connection: {
					host: redisConfig.host,
					port: redisConfig.port,
				},
				prefix: redisConfig.prefix + ":",
			}),
		}),
	],
	exports: [BullModule],
})
export class BullmqModule {}
