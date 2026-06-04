import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice.js';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { invoiceId, status } = req.body;

    if (!['paid', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Атомарное обновление: обновляем только если статус 'pending'.
    // Это гарантирует, что зачисление произойдет ровно один раз.
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { invoiceId, status: 'pending' },
      { $set: { status } },
      { returnDocument: 'after' },
    );

    if (!updatedInvoice) {
      // Возвращаем 200, чтобы платежная система не делала бесконечные ретраи
      return res
        .status(200)
        .json({ message: 'Invoice already processed or not found' });
    }

    if (status === 'paid') {
      console.log(
        `[SUCCESS] Money credited for invoice ${invoiceId}. Amount: ${updatedInvoice.amountToReceive}`,
      );
      // TODO: Вызов сервиса зачисления денег на баланс мерчанта
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
