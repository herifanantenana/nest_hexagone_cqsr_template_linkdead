import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./adapters/ioredis.adapter";

@Injectable()
export class RedisService {
	private readonly client: Redis;

	constructor(@Inject(REDIS_CLIENT) redisClient: Redis) {
		this.client = redisClient;
	}

	getClient(): Redis {
		return this.client;
	}
}
