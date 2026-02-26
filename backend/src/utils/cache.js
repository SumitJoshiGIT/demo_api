const { getRedisClient, isRedisReady } = require("../config/redis");
const logger = require("./logger");

const ensureReadyClient = async () => {
  const client = getRedisClient();
  if (!client) return null;

  if (!isRedisReady()) {
    try {
      await client.connect();
    } catch (_error) {
      return null;
    }
  }

  return isRedisReady() ? client : null;
};

const getCache = async (key) => {
  try {
    const client = await ensureReadyClient();
    if (!client) return null;

    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logger.warn("Redis getCache skipped", { message: error.message });
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 60) => {
  try {
    const client = await ensureReadyClient();
    if (!client) return;

    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.warn("Redis setCache skipped", { message: error.message });
  }
};

const delCacheByPattern = async (pattern) => {
  try {
    const client = await ensureReadyClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length) {
      await client.del(keys);
    }
  } catch (error) {
    logger.warn("Redis delCacheByPattern skipped", { message: error.message });
  }
};

module.exports = { getCache, setCache, delCacheByPattern };
