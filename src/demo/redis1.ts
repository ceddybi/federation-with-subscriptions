import Redis, { RedisOptions } from "ioredis";

import { RedisPubSub as PubSub } from "graphql-redis-subscriptions";

export const options: RedisOptions = {};

export const pubsub1 = new PubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
