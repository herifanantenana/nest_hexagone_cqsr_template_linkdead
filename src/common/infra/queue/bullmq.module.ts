import redisEnvConfig from "@apk_common/config/redis-env.config";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [redisEnvConfig.KEY],
			useFactory: (redisConfig: ConfigType<typeof redisEnvConfig>) => ({
				connection: {
					host: redisConfig.host,
					port: redisConfig.port,
					db: redisConfig.jobsDb,
				},
				prefix: `${redisConfig.jobsPrefix}:`,
			}),
		}),
	],
	exports: [BullModule],
})
export class BullmqModule {}
