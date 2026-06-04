import { expect } from 'chai';
import request from 'supertest';
import crypto from 'crypto';
import { describe, it, before, after, beforeEach } from 'mocha';
import { app, connectDB, mongoose } from '../src/app.js';
import { connectRedis, redisClient } from '../src/config/redis.js';
import { Invoice } from '../src/models/Invoice.js';
import { Merchant } from '../src/models/Merchant.js';
import { WEBHOOK_SECRET } from '../src/config/constants.js';

describe('Payment Gateway API (MVC)', () => {
  const testMerchantId = 'merch_mvc_123';

  before(async () => {
    await connectDB();
    await connectRedis();

    await Invoice.deleteMany({});
    await Merchant.deleteMany({});
    await redisClient.flushDb();

    await Merchant.create({
      merchantId: testMerchantId,
      feePercent: 0.05,
      webhookSecret: WEBHOOK_SECRET,
    });
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await redisClient.quit();
  });

  describe('POST /invoice', () => {
    it('должен корректно рассчитать комиссию и создать счет', async () => {
      const res = await request(app)
        .post('/invoice')
        .send({ amount: 1000, currency: 'USD', merchantId: testMerchantId });

      expect(res.status).to.equal(201);
      expect(res.body.fee).to.equal(50);
      expect(res.body.amountToReceive).to.equal(950);
    });
  });

  describe('POST /webhook', () => {
    let validInvoiceId: string;

    beforeEach(async () => {
      await Invoice.deleteMany({});

      const inv = await Invoice.create({
        invoiceId: 'inv_mvc_test_1',
        merchantId: testMerchantId,
        amount: 1000,
        currency: 'USD',
        fee: 50,
        amountToReceive: 950,
        status: 'pending',
      });
      validInvoiceId = inv.invoiceId;
    });

    const generatePayload = (
      invoiceId: string,
      status: string,
      nonce: string,
    ) => {
      const body = JSON.stringify({ invoiceId, status });
      const timestamp = Date.now().toString();
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      return { body, signature, timestamp, nonce };
    };

    it('должен отклонить запрос с неверной подписью', async () => {
      const payload = generatePayload(validInvoiceId, 'paid', 'nonce_bad_1');
      const res = await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', 'invalid')
        .set('X-Timestamp', payload.timestamp)
        .set('X-Nonce', payload.nonce)
        .send(payload.body);

      expect(res.status).to.equal(401);
    });

    it('должен обработать webhook и изменить статус на paid', async () => {
      const payload = generatePayload(validInvoiceId, 'paid', 'nonce_good_1');
      const res = await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', payload.signature)
        .set('X-Timestamp', payload.timestamp)
        .set('X-Nonce', payload.nonce)
        .send(payload.body);

      expect(res.status).to.equal(200);
      const updated = await Invoice.findOne({ invoiceId: validInvoiceId });
      expect(updated?.status).to.equal('paid');
    });

    it('должен обеспечить идемпотентность через Redis (повторный nonce)', async () => {
      const payload = generatePayload(
        validInvoiceId,
        'paid',
        'nonce_idempotent_1',
      );

      // Первый раз
      await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', payload.signature)
        .set('X-Timestamp', payload.timestamp)
        .set('X-Nonce', payload.nonce)
        .send(payload.body);

      // Второй раз с тем же nonce
      const res2 = await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', payload.signature)
        .set('X-Timestamp', payload.timestamp)
        .set('X-Nonce', payload.nonce)
        .send(payload.body);

      expect(res2.status).to.equal(409);
      expect(res2.body.error).to.equal('Nonce already used (replay attack)');
    });

    it('должен обеспечить идемпотентность через БД (новый nonce, но счет уже paid)', async () => {
      // Создаем уже оплаченный счет вручную, чтобы тест не зависел от beforeEach
      const prePaidInvoiceId = 'inv_db_idempotent_test';
      await Invoice.create({
        invoiceId: prePaidInvoiceId,
        merchantId: testMerchantId,
        amount: 500,
        currency: 'USD',
        fee: 25,
        amountToReceive: 475,
        status: 'paid',
      });

      const payload = generatePayload(
        prePaidInvoiceId,
        'paid',
        'nonce_db_idempotent',
      );
      const res = await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Signature', payload.signature)
        .set('X-Timestamp', payload.timestamp)
        .set('X-Nonce', payload.nonce)
        .send(payload.body);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal(
        'Invoice already processed or not found',
      );
    });
  });
});
