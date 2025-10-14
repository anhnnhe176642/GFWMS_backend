import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/role.routes.js';
import fabricRoutes from './routes/fabric.routes.js'; 
import fabricGlossRouters from './routes/fabricgloss.routes.js'; 
import fabricColorRouters from './routes/fabricColor.routes.js'; 
import fabricCategoryRouters from './routes/fabricCategory.routes.js'; 
import supplierRouters from './routes/supplier.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { swaggerUi, swaggerSpec, swaggerUiOptions } from './config/swagger.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  ...swaggerUiOptions,
  customSiteTitle: 'GFWMS API Documentation'
}));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/fabrics', fabricRoutes); 
app.use('/fabric-gloss', fabricGlossRouters);
app.use('/fabric-color', fabricColorRouters);
app.use('/fabric-category', fabricCategoryRouters);
app.use('/supplier', supplierRouters);
// Health check route
app.get('/check', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
