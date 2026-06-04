import express, { Request } from 'express';
// Никак не хотел видеть express.d.ts, поэтому написал прямо сюда
declare module 'express' {
  export interface Request {
    rawBody?: string;
  }
}

// Middleware для сохранения исходной строки тела запроса (нужно для HMAC)
export const rawBodyMiddleware = express.json({
  verify: (req: express.Request, res, buf) => {
    req.rawBody = buf.toString();
  },
});
