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
import exportFabricRouters from './v1/exportFabric.routes.js';
import storeRouters from './v1/store.routes.js';
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
router.use('/export-fabrics', exportFabricRouters);
router.use('/stores', storeRouters);
export default router;