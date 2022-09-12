import Redis, { RedisOptions } from "ioredis";

import { RedisPubSub as PubSub } from "graphql-redis-subscriptions";
import { options } from "./redis1";

export const pubsub2 = new PubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
