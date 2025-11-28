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


if (process.env.NODE_ENV !== 'test') {
  if (process.env.ENABLE_CRON === 'true') {
    // Cancel expired orders + check PayOS - Mỗi phút
    cron.schedule('* * * * *', () => {
      cancelExpiredOrders();
    });
    
    // Reconciliation - Mỗi 5 phút
    cron.schedule('*/5 * * * *', () => {
      reconcilePendingPayments();
    });
  }
}

export default app;