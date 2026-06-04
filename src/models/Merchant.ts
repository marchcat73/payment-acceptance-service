import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchant extends Document {
  merchantId: string;
  feePercent: number;
  webhookSecret: string;
}

const MerchantSchema = new Schema<IMerchant>({
  merchantId: { type: String, required: true, unique: true },
  feePercent: { type: Number, required: true },
  webhookSecret: { type: String, required: true },
});

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);
