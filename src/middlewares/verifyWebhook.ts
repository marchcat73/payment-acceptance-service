import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { WEBHOOK_SECRET, MAX_TIMESTAMP_AGE_MS } from '../config/constants.js';
import { redisClient } from '../config/redis.js';

export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;
  const nonce = req.headers['x-nonce'] as string;
  const rawBody = req.rawBody;

  if (!signature || !timestamp || !nonce || !rawBody) {
    return res.status(400).json({ error: 'Missing required headers or body' });
  }

  // 1. Проверка подписи HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Проверка актуальности времени
  const now = Date.now();
  if (Math.abs(now - parseInt(timestamp, 10)) > MAX_TIMESTAMP_AGE_MS) {
    return res.status(400).json({ error: 'Request timestamp is too old' });
  }

  // 3. Проверка уникальности nonce через Redis (атомарная операция SET NX)
  const redisKey = `webhook_nonce:${nonce}`;
  const isSet = await redisClient.set(redisKey, '1', { EX: 3600, NX: true });

  if (!isSet) {
    return res
      .status(409)
      .json({ error: 'Nonce already used (replay attack)' });
  }

  next();
};
