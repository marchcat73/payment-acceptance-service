import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController.js';
import { verifyWebhook } from '../middlewares/verifyWebhook.js';

const router = Router();

// Middleware применяется только к этому роуту
router.post('/', verifyWebhook, handleWebhook);

export default router;
