// Minimal ambient declaration for `process` to avoid needing @types/node in this repo
declare const process: { env: { [key: string]: string | undefined } };

export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'super_secret_key';
export const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 минут
