import express from 'express';

import userRoutes from './v1/user.routes.js';
import authRoutes from './v1/auth.routes.js';
import roleRoutes from './v1/role.routes.js';
import permissionRoutes from './v1/permission.routes.js';
import warehouseRoutes from './v1/warehouse.routes.js';
import fabricRoutes from './v1/fabric.routes.js'; 
import fabricGlossRouters from './v1/fabricgloss.routes.js'; 
import fabricColorRouters from './v1/fabricColor.routes.js'; 
import fabricCategoryRouters from './v1/fabricCategory.routes.js'; 
import supplierRouters from './v1/supplier.routes.js';


import importFabricRoutes from './v1/importFabric.routes.js';
import invoiceRouters from './v1/invoice.routes.js';
import exportFabricRouters from './v1/exportFabric.routes.js';
import storeRouters from './v1/store.routes.js';
import fabricShelfRouters from './v1/fabricShelf.route.js';
import shelfRouters from './v1/shelf.routes.js';
import geminiRoutes from './v1/gemini.routes.js';
import orderRoutes from './v1/order.routes.js';
import bannerRoutes from './v1/banner.routes.js';
import bannerDiscount from './v1/bannerDiscount.routes.js';
import yoloRoutes from './v1/yolo.routes.js';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/fabrics', fabricRoutes);
router.use('/fabric-gloss', fabricGlossRouters);
router.use('/fabric-color', fabricColorRouters);
router.use('/fabric-category', fabricCategoryRouters);
router.use('/supplier', supplierRouters);
router.use('/import-fabrics', importFabricRoutes);
router.use('/invoices', invoiceRouters);
router.use('/export-fabrics', exportFabricRouters);
router.use('/stores', storeRouters);
router.use('/fabric-shelf', fabricShelfRouters);
router.use('/shelves', shelfRouters);
router.use('/gemini', geminiRoutes);
router.use('/orders', orderRoutes);
router.use('/banner', bannerRoutes);
router.use('/banner-discount', bannerDiscount);

// YOLO detection routes
router.use('/yolo', yoloRoutes);
export default router;