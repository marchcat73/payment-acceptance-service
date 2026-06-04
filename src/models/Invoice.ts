// src/models/Invoice.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceId: string;
  merchantId: string;
  amount: number;
  currency: string;
  fee: number;
  amountToReceive: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updateAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true },
    merchantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    fee: { type: Number, required: true },
    amountToReceive: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
