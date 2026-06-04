import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const connectRedis = async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
};
