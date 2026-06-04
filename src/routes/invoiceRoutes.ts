import { Router } from 'express';
import { createInvoice, getInvoice } from '../controllers/invoiceController.js';

const router = Router();

router.post('/', createInvoice);
router.get('/:id', getInvoice);

export default router;
