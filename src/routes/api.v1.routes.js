import express from 'express';

import userRoutes from './v1/user.routes.js';
import authRoutes from './v1/auth.routes.js';
import roleRoutes from './v1/role.routes.js';
import warehouseRoutes from './v1/warehouse.routes.js';
import fabricRoutes from './v1/fabric.routes.js'; 
import fabricGlossRouters from './v1/fabricgloss.routes.js'; 
import fabricColorRouters from './v1/fabricColor.routes.js'; 
import fabricCategoryRouters from './v1/fabricCategory.routes.js'; 
import supplierRouters from './v1/supplier.routes.js';
import invoiceRouters from './v1/invoice.routes.js';
import customerRoutes from './v1/customer.routes.js';
import wishlistRoutes from './v1/wishlist.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/fabrics', fabricRoutes);
router.use('/fabric-gloss', fabricGlossRouters);
router.use('/fabric-color', fabricColorRouters);
router.use('/fabric-category', fabricCategoryRouters);
router.use('/supplier', supplierRouters);
router.use('/invoices', invoiceRouters);
router.use('/customers', customerRoutes);
router.use('/wishlist', wishlistRoutes);

export default router;