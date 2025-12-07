import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiV1Routes from './routes/api.v1.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { swaggerUi, swaggerSpec, swaggerUiOptions } from './config/swagger.js';
import { cancelExpiredOrders } from './jobs/payment-expiration.job.js';
import { reconcilePendingPayments } from './jobs/payment-reconciliation.job.js';
import { checkCreditInvoices } from './jobs/credit-invoice.job.js';
import { autoLockCreditOverdue } from './jobs/credit-lock.job.js';
import cron from 'node-cron';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("dev"));

// Serve dataset images as static files
const datasetsPath = path.join(__dirname, 'datasets');
app.use('/datasets', express.static(datasetsPath));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  ...swaggerUiOptions,
  customSiteTitle: 'GFWMS API Documentation'
}));

// api v1 routes
app.use('/api/v1', apiV1Routes);

// Health check route
app.get('/check', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);


if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_CRON === 'true') {
  // Cancel expired orders + check PayOS - mỗi phút
  cron.schedule('* * * * *', async () => {
    try {
      await cancelExpiredOrders();
    } catch (err) {
      console.error("Lỗi trong cron CancelExpiredOrders:", err);
    }
  });

  // Reconciliation - mỗi 5 phút
  cron.schedule('*/5 * * * *', async () => {
    try {
      await reconcilePendingPayments();
    } catch (err) {
      console.error("Lỗi trong cron ReconcilePayments:", err);
    }
  });

  // Check credit invoices - mỗi ngày 0h
  cron.schedule('0 0 * * *', async () => {
    try {
      await checkCreditInvoices();
    } catch (err) {
      console.error("Lỗi trong cron CheckCreditInvoices:", err);
    }
  });

  // Auto lock credit overdue - mỗi phút (test)
  cron.schedule('0 0 * * *', async () => {
    try {
      await autoLockCreditOverdue();
    } catch (err) {
      console.error("Lỗi trong cron AutoLockCredit:", err);
    }
  });
}


export default app;