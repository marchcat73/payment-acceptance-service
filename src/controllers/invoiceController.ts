import { Request, Response } from 'express';
import crypto from 'crypto';
import { Invoice } from '../models/Invoice.js';
import { Merchant } from '../models/Merchant.js';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { amount, currency, merchantId } = req.body;

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const fee = Number((amount * merchant.feePercent).toFixed(2));
    const amountToReceive = Number((amount - fee).toFixed(2));
    const invoiceId = `inv_${crypto.randomBytes(8).toString('hex')}`;

    const invoice = new Invoice({
      invoiceId,
      merchantId,
      amount,
      currency,
      fee,
      amountToReceive,
      status: 'pending',
    });

    await invoice.save();

    res.status(201).json({
      invoiceId,
      amount,
      fee,
      amountToReceive,
      status: 'pending',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({ invoiceId: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
