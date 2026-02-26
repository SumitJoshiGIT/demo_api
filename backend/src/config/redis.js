const Redis = require("ioredis");
const logger = require("../utils/logger");

let redisClient = null;

const isRedisReady = () => redisClient && redisClient.status === "ready";

const getRedisClient = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redisClient.on("connect", () => logger.info("Redis connected"));
  redisClient.on("ready", () => logger.info("Redis ready"));
  redisClient.on("error", (error) => {
    logger.warn("Redis error", { message: error.message });
  });
  redisClient.on("end", () => logger.warn("Redis connection closed"));

  return redisClient;
};

module.exports = { getRedisClient, isRedisReady };
