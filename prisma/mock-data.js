import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Cấu hình số lượng bản ghi cho mỗi bảng từ environment variables
// Sử dụng giá trị mặc định nếu không có trong .env
const CONFIG = {
  USERS: parseInt(process.env.MOCK_USERS) || 200,
  FABRIC_CATEGORIES: parseInt(process.env.MOCK_FABRIC_CATEGORIES) || 100,
  FABRIC_COLORS: parseInt(process.env.MOCK_FABRIC_COLORS) || 150,
  FABRIC_GLOSS: parseInt(process.env.MOCK_FABRIC_GLOSS) || 80,
  SUPPLIERS: parseInt(process.env.MOCK_SUPPLIERS) || 120,
  WAREHOUSES: parseInt(process.env.MOCK_WAREHOUSES) || 50,
  STORES: parseInt(process.env.MOCK_STORES) || 80,
  FABRICS: parseInt(process.env.MOCK_FABRICS) || 500,
  SHELVES_PER_WAREHOUSE: parseInt(process.env.MOCK_SHELVES_PER_WAREHOUSE) || 100,
  IMPORT_FABRICS: parseInt(process.env.MOCK_IMPORT_FABRICS) || 150,
  IMPORT_ITEMS_PER_IMPORT: parseInt(process.env.MOCK_IMPORT_ITEMS_PER_IMPORT) || 5,
  EXPORT_FABRICS: parseInt(process.env.MOCK_EXPORT_FABRICS) || 120,
  EXPORT_ITEMS_PER_EXPORT: parseInt(process.env.MOCK_EXPORT_ITEMS_PER_EXPORT) || 40,
  FABRIC_SHELVES: parseInt(process.env.MOCK_FABRIC_SHELVES) || 400,
  FABRIC_STORES: parseInt(process.env.MOCK_FABRIC_STORES) || 350,
  ORDERS: parseInt(process.env.MOCK_ORDERS) || 200,
  ORDER_ITEMS_PER_ORDER: parseInt(process.env.MOCK_ORDER_ITEMS_PER_ORDER) || 3,
  INVOICE_PERCENTAGE: parseFloat(process.env.MOCK_INVOICE_PERCENTAGE) || 0.9,
  PAYMENT_PERCENTAGE: parseFloat(process.env.MOCK_PAYMENT_PERCENTAGE) || 0.8,
};

async function main() {
  console.log('🚀 Starting optimized mock data generation...\n');
  
  // Hiển thị cấu hình
  console.log('⚙️  Configuration:');
  console.log(`   - Users: ${CONFIG.USERS}`);
  console.log(`   - Fabric Categories: ${CONFIG.FABRIC_CATEGORIES}`);
  console.log(`   - Fabric Colors: ${CONFIG.FABRIC_COLORS}`);
  console.log(`   - Warehouses: ${CONFIG.WAREHOUSES}`);
  console.log(`   - Stores: ${CONFIG.STORES}`);
  console.log(`   - Fabrics: ${CONFIG.FABRICS}`);
  console.log(`   - Shelves per Warehouse: ${CONFIG.SHELVES_PER_WAREHOUSE}`);
  console.log(`   - Orders: ${CONFIG.ORDERS}`);
  console.log(`   - Order Items per Order: ${CONFIG.ORDER_ITEMS_PER_ORDER}\n`);

  // Lấy roles có sẵn từ seed
  const roles = await prisma.role.findMany();
  console.log(`✅ Found ${roles.length} existing roles`);

  // 1. TẠO USERS
  console.log('\n📝 Preparing users data...');
  const existingUsers = await prisma.user.findMany({ select: { username: true, email: true, phone: true } });
  const existingUsernames = new Set(existingUsers.map(u => u.username));
  const existingEmails = new Set(existingUsers.map(u => u.email));
  const existingPhones = new Set(existingUsers.map(u => u.phone));
  const hashedPassword = await bcrypt.hash('password123', 10);
  const userRoles = roles.map(r => r.name);
  
  const usersToCreate = [];
  for (let i = 0; i < CONFIG.USERS; i++) {
    const username = faker.person.fullName().toLowerCase().replace(/ /g, '');
    const email = faker.internet.email();
    const phone = `09${String(10000000 + i).padStart(8, '0')}`;
    
    if (!existingUsernames.has(username) && !existingEmails.has(email) && !existingPhones.has(phone)) {
      usersToCreate.push({
        username,
        password: hashedPassword,
        email,
        phone,
        fullname: faker.person.fullName(),
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        address: faker.location.streetAddress(true),
        dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
        emailVerified: faker.datatype.boolean(0.8),
        emailVerifiedAt: faker.datatype.boolean(0.8) ? new Date() : null,
        role: faker.helpers.arrayElement(userRoles),
      });
      existingUsernames.add(username);
      existingEmails.add(email);
      existingPhones.add(phone);
    }
  }
  
  const usersResult = await prisma.user.createMany({ data: usersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${usersResult.count} users`);
  const allUsers = await prisma.user.findMany();

  // 2. TẠO FABRIC CATEGORIES
  console.log('\n📝 Preparing fabric categories...');
  const existingCategories = await prisma.fabricCategory.findMany({ select: { name: true } });
  const existingCategoryNames = new Set(existingCategories.map(c => c.name));
  
  const categoryNames = [
    'Vải Cotton', 'Vải Lụa', 'Vải Polyester', 'Vải Kaki', 'Vải Denim', 
    'Vải Len', 'Vải Kate', 'Vải Thun', 'Vải Linen', 'Vải Nhung'
  ];
  
  const categoriesToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_CATEGORIES; i++) {
    const name = i < categoryNames.length 
      ? categoryNames[i] 
      : `${faker.commerce.productMaterial()} Fabric ${faker.string.alphanumeric(3)}`;
    
    if (!existingCategoryNames.has(name)) {
      categoriesToCreate.push({
        name,
        sellingPricePerMeter: faker.number.float({ min: 50000, max: 300000, multipleOf: 1000 }),
        sellingPricePerRoll: faker.number.float({ min: 500000, max: 3000000, multipleOf: 10000 }),
        description: faker.commerce.productDescription(),
      });
      existingCategoryNames.add(name);
    }
  }
  
  const categoriesResult = await prisma.fabricCategory.createMany({ data: categoriesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${categoriesResult.count} fabric categories`);
  const allCategories = await prisma.fabricCategory.findMany();

  // 3. TẠO FABRIC COLORS
  console.log('\n📝 Preparing fabric colors...');
  const existingColors = await prisma.fabricColor.findMany({ select: { id: true, name: true } });
  const existingColorNames = new Set(existingColors.map(c => c.name));
  
  const colorNames = [
    'Đỏ', 'Xanh dương', 'Xanh lá', 'Vàng', 'Cam', 'Tím', 'Hồng', 'Nâu', 
    'Xám', 'Đen', 'Trắng', 'Be', 'Navy', 'Olive', 'Burgundy'
  ];
  
  const colorsToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_COLORS; i++) {
    const colorId = `CLR${faker.string.alphanumeric(3)}`;
    const name = i < colorNames.length 
      ? colorNames[i] 
      : `${faker.color.human()} ${faker.string.alphanumeric(3)}`;
    
    if (!existingColorNames.has(name)) {
      colorsToCreate.push({ id: colorId, name });
      existingColorNames.add(name);
    }
  }
  
  const colorsResult = await prisma.fabricColor.createMany({ data: colorsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${colorsResult.count} fabric colors`);
  const allColors = await prisma.fabricColor.findMany();

  // 4. TẠO FABRIC GLOSS
  console.log('\n📝 Preparing fabric gloss levels...');
  const existingGlosses = await prisma.fabricGloss.findMany({ select: { description: true } });
  const existingGlossDescs = new Set(existingGlosses.map(g => g.description));
  
  const glossDescriptions = [
    'Mờ', 'Bóng nhẹ', 'Bóng vừa', 'Bóng cao',
    'Matte', 'Semi-gloss', 'High gloss', 'Satin'
  ];
  
  const glossesToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_GLOSS; i++) {
    const description = i < glossDescriptions.length 
      ? glossDescriptions[i] 
      : `Gloss Level ${faker.string.alphanumeric(3)}`;
    
    if (!existingGlossDescs.has(description)) {
      glossesToCreate.push({ description });
      existingGlossDescs.add(description);
    }
  }
  
  const glossesResult = await prisma.fabricGloss.createMany({ data: glossesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${glossesResult.count} fabric gloss levels`);
  const allGlosses = await prisma.fabricGloss.findMany();

  // 5. TẠO SUPPLIERS
  console.log('\n📝 Preparing suppliers...');
  const existingSuppliers = await prisma.supplier.findMany({ select: { phone: true } });
  const existingSupplierPhones = new Set(existingSuppliers.map(s => s.phone));
  
  const suppliersToCreate = [];
  for (let i = 0; i < CONFIG.SUPPLIERS; i++) {
    const phone = `08${String(10000000 + i).padStart(8, '0')}`;
    
    if (!existingSupplierPhones.has(phone)) {
      suppliersToCreate.push({
        name: faker.company.name(),
        address: faker.location.streetAddress(true),
        phone,
        isActive: faker.datatype.boolean(0.9),
      });
      existingSupplierPhones.add(phone);
    }
  }
  
  const suppliersResult = await prisma.supplier.createMany({ data: suppliersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${suppliersResult.count} suppliers`);
  const allSuppliers = await prisma.supplier.findMany();

  // 6. TẠO WAREHOUSES
  console.log('\n📝 Preparing warehouses...');
  const existingWarehouses = await prisma.warehouse.findMany({ select: { name: true } });
  const existingWarehouseNames = new Set(existingWarehouses.map(w => w.name));
  
  const warehouseNames = [
    'Kho Miền Bắc', 'Kho Miền Nam', 'Kho Miền Trung',
    'Kho Trung Tâm', 'Kho Dự Phòng'
  ];
  
  const warehousesToCreate = [];
  for (let i = 0; i < CONFIG.WAREHOUSES; i++) {
    const name = i < warehouseNames.length 
      ? warehouseNames[i] 
      : `Warehouse ${faker.location.city()} ${faker.string.alphanumeric(3)}`;
    
    if (!existingWarehouseNames.has(name)) {
      warehousesToCreate.push({
        name,
        address: faker.location.streetAddress(true),
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
      });
      existingWarehouseNames.add(name);
    }
  }
  
  const warehousesResult = await prisma.warehouse.createMany({ data: warehousesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${warehousesResult.count} warehouses`);
  const allWarehouses = await prisma.warehouse.findMany();

  // 7. TẠO STORES
  console.log('\n📝 Preparing stores...');
  const storeNames = [
    'Cửa hàng Quận 1', 'Cửa hàng Quận 2', 'Cửa hàng Hà Nội',
    'Cửa hàng Đà Nẵng', 'Cửa hàng Cần Thơ', 'Cửa hàng Hải Phòng',
    'Cửa hàng Nha Trang', 'Cửa hàng Vũng Tàu'
  ];
  
  const storesToCreate = [];
  for (let i = 0; i < CONFIG.STORES; i++) {
    const name = i < storeNames.length 
      ? storeNames[i] 
      : `Store ${faker.location.city()} ${faker.string.alphanumeric(3)}`;
    
    storesToCreate.push({
      name,
      address: faker.location.streetAddress(true),
      isActive: faker.datatype.boolean(0.9),
    });
  }
  
  const storesResult = await prisma.store.createMany({ data: storesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${storesResult.count} stores`);
  const allStores = await prisma.store.findMany();

  // 8. TẠO SHELVES
  console.log('\n📝 Preparing shelves...');
  const existingShelves = await prisma.shelf.findMany({ select: { code: true } });
  const existingShelfCodes = new Set(existingShelves.map(s => s.code));
  
  const shelvesToCreate = [];
  for (const warehouse of allWarehouses) {
    for (let i = 0; i < CONFIG.SHELVES_PER_WAREHOUSE; i++) {
      const code = `${warehouse.name.substring(0, 3).toUpperCase()}-SHF-${String(i + 1).padStart(4, '0')}`;
      
      if (!existingShelfCodes.has(code)) {
        shelvesToCreate.push({
          code,
          currentQuantity: faker.number.int({ min: 0, max: 30 }),
          maxQuantity: faker.number.int({ min: 40, max: 100 }),
          warehouseId: warehouse.id,
        });
        existingShelfCodes.add(code);
      }
    }
  }
  
  const shelvesResult = await prisma.shelf.createMany({ data: shelvesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${shelvesResult.count} shelves`);
  const allShelves = await prisma.shelf.findMany();

  // 9. TẠO FABRICS
  console.log('\n📝 Preparing fabrics...');
  const fabricsToCreate = [];
  
  for (let i = 0; i < CONFIG.FABRICS; i++) {
    fabricsToCreate.push({
      thickness: faker.number.float({ min: 0.1, max: 5.0, multipleOf: 0.1 }),
      glossId: faker.helpers.arrayElement(allGlosses).id,
      length: faker.number.float({ min: 10, max: 100, multipleOf: 0.5 }),
      width: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      weight: faker.number.float({ min: 0.5, max: 10, multipleOf: 0.1 }),
      sellingPrice: faker.number.float({ min: 50000, max: 500000, multipleOf: 1000 }),
      quantityInStock: faker.number.int({ min: 0, max: 1000 }),
      categoryId: faker.helpers.arrayElement(allCategories).id,
      colorId: faker.helpers.arrayElement(allColors).id,
      supplierId: faker.helpers.arrayElement(allSuppliers).id,
    });
  }
  
  const fabricsResult = await prisma.fabric.createMany({ data: fabricsToCreate });
  console.log(`✅ Created ${fabricsResult.count} fabrics`);
  const allFabrics = await prisma.fabric.findMany();

  // 10. TẠO FABRIC SHELVES
  console.log('\n📝 Preparing fabric-shelf relationships...');
  const fabricShelvesToCreate = [];
  const fabricShelfKeys = new Set();
  
  for (let i = 0; i < CONFIG.FABRIC_SHELVES; i++) {
    const fabricId = faker.helpers.arrayElement(allFabrics).id;
    const shelfId = faker.helpers.arrayElement(allShelves).id;
    const key = `${fabricId}-${shelfId}`;
    
    if (!fabricShelfKeys.has(key)) {
      fabricShelvesToCreate.push({
        fabricId,
        shelfId,
        quantity: faker.number.int({ min: 1, max: 50 }),
      });
      fabricShelfKeys.add(key);
    }
  }
  
  const fabricShelvesResult = await prisma.fabricShelf.createMany({ data: fabricShelvesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${fabricShelvesResult.count} fabric-shelf relationships`);

  // 11. TẠO FABRIC STORES
  console.log('\n📝 Preparing fabric-store relationships...');
  const fabricStoresToCreate = [];
  const fabricStoreKeys = new Set();
  
  for (let i = 0; i < CONFIG.FABRIC_STORES; i++) {
    const fabricId = faker.helpers.arrayElement(allFabrics).id;
    const storeId = faker.helpers.arrayElement(allStores).id;
    const key = `${fabricId}-${storeId}`;
    
    if (!fabricStoreKeys.has(key)) {
      fabricStoresToCreate.push({
        fabricId,
        storeId,
        quantity: faker.number.int({ min: 5, max: 100 }),
      });
      fabricStoreKeys.add(key);
    }
  }
  
  const fabricStoresResult = await prisma.fabricStore.createMany({ data: fabricStoresToCreate, skipDuplicates: true });
  console.log(`✅ Created ${fabricStoresResult.count} fabric-store relationships`);

  // 12. TẠO IMPORT FABRICS
  console.log('\n📝 Preparing import fabric records...');
  const importFabricsToCreate = [];
  
  for (let i = 0; i < CONFIG.IMPORT_FABRICS; i++) {
    importFabricsToCreate.push({
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      importer: faker.helpers.arrayElement(allUsers).id,
      importDate: faker.date.recent({ days: 90 }),
      totalPrice: faker.number.float({ min: 1000000, max: 10000000, multipleOf: 10000 }),
    });
  }
  
  const importFabricsResult = await prisma.importFabric.createMany({ data: importFabricsToCreate });
  console.log(`✅ Created ${importFabricsResult.count} import fabric records`);
  const allImportFabrics = await prisma.importFabric.findMany();

  // 13. TẠO IMPORT FABRIC ITEMS
  console.log('\n📝 Preparing import fabric items...');
  const importItemsToCreate = [];
  const importItemKeys = new Set();
  
  for (const importFabric of allImportFabrics) {
    const itemsCount = Math.min(CONFIG.IMPORT_ITEMS_PER_IMPORT, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    
    for (const fabric of selectedFabrics) {
      const key = `${importFabric.id}-${fabric.id}`;
      if (!importItemKeys.has(key)) {
        importItemsToCreate.push({
          importFabricId: importFabric.id,
          fabricId: fabric.id,
          quantity: faker.number.int({ min: 10, max: 100 }),
          price: faker.number.float({ min: 30000, max: 400000, multipleOf: 1000 }),
        });
        importItemKeys.add(key);
      }
    }
  }
  
  const importItemsResult = await prisma.importFabricItem.createMany({ data: importItemsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${importItemsResult.count} import fabric items`);

  // 14. TẠO WAREHOUSE MANAGES
  console.log('\n📝 Preparing warehouse managers...');
  const warehouseManagesToCreate = [];
  const warehouseManageKeys = new Set();
  
  for (const warehouse of allWarehouses) {
    const managersCount = faker.number.int({ min: 1, max: 3 });
    const selectedManagers = faker.helpers.arrayElements(allUsers, managersCount);
    const assigner = faker.helpers.arrayElement(allUsers);
    
    for (const manager of selectedManagers) {
      const key = `${manager.id}-${warehouse.id}`;
      if (!warehouseManageKeys.has(key)) {
        warehouseManagesToCreate.push({
          userId: manager.id,
          warehouseId: warehouse.id,
          assignedBy: assigner.id,
          assignedAt: faker.date.past({ years: 1 }),
        });
        warehouseManageKeys.add(key);
      }
    }
  }
  
  const warehouseManagesResult = await prisma.warehouseManage.createMany({ data: warehouseManagesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${warehouseManagesResult.count} warehouse manager assignments`);

  // 15. TẠO EXPORT FABRICS
  console.log('\n📝 Preparing export fabric records...');
  const exportStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const exportFabricsToCreate = [];
  
  for (let i = 0; i < CONFIG.EXPORT_FABRICS; i++) {
    const status = faker.helpers.arrayElement(exportStatuses);
    const exportData = {
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      storeId: faker.helpers.arrayElement(allStores).id,
      createdById: faker.helpers.arrayElement(allUsers).id,
      status: status,
      note: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : null,
    };
    
    if (status === 'APPROVED') {
      exportData.receivedById = faker.helpers.arrayElement(allUsers).id;
    }
    
    exportFabricsToCreate.push(exportData);
  }
  
  const exportFabricsResult = await prisma.exportFabric.createMany({ data: exportFabricsToCreate });
  console.log(`✅ Created ${exportFabricsResult.count} export fabric records`);
  const allExportFabrics = await prisma.exportFabric.findMany();

  // 16. TẠO EXPORT FABRIC ITEMS
  console.log('\n📝 Preparing export fabric items...');
  const exportItemsToCreate = [];
  const exportItemKeys = new Set();
  
  for (const exportFabric of allExportFabrics) {
    const itemsCount = Math.min(CONFIG.EXPORT_ITEMS_PER_EXPORT, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    
    for (const fabric of selectedFabrics) {
      const key = `${exportFabric.id}-${fabric.id}`;
      if (!exportItemKeys.has(key)) {
        exportItemsToCreate.push({
          exportFabricId: exportFabric.id,
          fabricId: fabric.id,
          quantity: faker.number.int({ min: 5, max: 50 }),
          price: faker.number.float({ min: 40000, max: 500000, multipleOf: 1000 }),
        });
        exportItemKeys.add(key);
      }
    }
  }
  
  const exportItemsResult = await prisma.exportFabricItem.createMany({ data: exportItemsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${exportItemsResult.count} export fabric items`);

  // 15. TẠO ORDERS
  console.log('\n📝 Preparing orders...');
  const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];
  const ordersToCreate = [];
  
  for (let i = 0; i < CONFIG.ORDERS; i++) {
    const randomUser = faker.helpers.arrayElement(allUsers);
    const orderDate = faker.date.between({ from: '2024-01-01', to: new Date() });
    
    ordersToCreate.push({
      userId: randomUser.id,
      orderDate,
      status: faker.helpers.arrayElement(orderStatuses),
      totalAmount: 0, // Will be calculated based on order items
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    });
  }
  
  const ordersResult = await prisma.order.createMany({ data: ordersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${ordersResult.count} orders`);
  
  // Lấy tất cả orders vừa tạo
  const allOrders = await prisma.order.findMany({ orderBy: { id: 'asc' } });

  // 16. TẠO ORDER ITEMS
  console.log('\n📝 Preparing order items...');
  const orderItemsToCreate = [];
  const orderItemKeys = new Set();
  const orderTotals = new Map(); // Track total amount for each order
  
  for (const order of allOrders) {
    const itemsCount = Math.min(CONFIG.ORDER_ITEMS_PER_ORDER, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    let orderTotal = 0;
    
    for (const fabric of selectedFabrics) {
      const key = `${order.id}-${fabric.id}`;
      if (!orderItemKeys.has(key)) {
        const quantity = faker.number.int({ min: 1, max: 20 });
        const price = faker.number.float({ min: 50000, max: 1000000, multipleOf: 1000 });
        const itemTotal = quantity * price;
        
        orderItemsToCreate.push({
          orderId: order.id,
          fabricId: fabric.id,
          quantity,
          price,
        });
        orderItemKeys.add(key);
        orderTotal += itemTotal;
      }
    }
    
    orderTotals.set(order.id, orderTotal);
  }
  
  const orderItemsResult = await prisma.orderItem.createMany({ data: orderItemsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${orderItemsResult.count} order items`);

  // Update order total amounts
  console.log('\n📝 Updating order totals...');
  const orderUpdatePromises = [];
  for (const [orderId, totalAmount] of orderTotals.entries()) {
    orderUpdatePromises.push(
      prisma.order.update({
        where: { id: orderId },
        data: { totalAmount },
      })
    );
  }
  await Promise.all(orderUpdatePromises);
  console.log(`✅ Updated ${orderUpdatePromises.length} order totals`);

  // 17. TẠO INVOICES (90% của orders)
  console.log('\n📝 Preparing invoices...');
  const invoiceStatuses = ['UNPAID', 'PAID', 'OVERDUE', 'CREDIT', 'REFUNDED', 'CANCELED'];
  const invoicesToCreate = [];
  const ordersWithInvoices = faker.helpers.arrayElements(
    allOrders, 
    Math.floor(allOrders.length * CONFIG.INVOICE_PERCENTAGE)
  );
  
  for (const order of ordersWithInvoices) {
    const invoiceDate = new Date(order.orderDate);
    const dueDate = faker.date.soon({ days: 30, refDate: invoiceDate });
    
    invoicesToCreate.push({
      orderId: order.id,
      invoiceDate,
      dueDate,
      invoiceStatus: faker.helpers.arrayElement(invoiceStatuses),
      totalAmount: order.totalAmount,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    });
  }
  
  const invoicesResult = await prisma.invoice.createMany({ data: invoicesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${invoicesResult.count} invoices`);
  
  // Lấy tất cả invoices vừa tạo
  const allInvoices = await prisma.invoice.findMany({ orderBy: { id: 'asc' } });

  // 18. TẠO PAYMENTS (80% của invoices)
  console.log('\n📝 Preparing payments...');
  const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'E_WALLET'];
  const paymentsToCreate = [];
  const invoicesWithPayments = faker.helpers.arrayElements(
    allInvoices, 
    Math.floor(allInvoices.length * CONFIG.PAYMENT_PERCENTAGE)
  );
  
  for (const invoice of invoicesWithPayments) {
    const paymentDate = faker.date.between({ 
      from: invoice.invoiceDate, 
      to: new Date() 
    });
    
    paymentsToCreate.push({
      invoiceId: invoice.id,
      paymentDate,
      amount: faker.number.float({ 
        min: invoice.totalAmount * 0.5, 
        max: invoice.totalAmount, 
        multipleOf: 1000 
      }),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      transactionId: faker.helpers.maybe(() => 
        `TXN-${faker.string.alphanumeric(12).toUpperCase()}`, 
        { probability: 0.7 }
      ),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    });
  }
  
  const paymentsResult = await prisma.payment.createMany({ data: paymentsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${paymentsResult.count} payments`);

  // Lấy tổng số cho các bảng relationships
  console.log('\n📊 Counting total records...');
  const [totalFabricShelves, totalFabricStores, totalImportFabrics, totalImportItems, totalExportFabrics, totalExportItems, totalWarehouseManages, totalOrders, totalOrderItems, totalInvoices, totalPayments] = await Promise.all([
    prisma.fabricShelf.count(),
    prisma.fabricStore.count(),
    prisma.importFabric.count(),
    prisma.importFabricItem.count(),
    prisma.exportFabric.count(),
    prisma.exportFabricItem.count(),
    prisma.warehouseManage.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
  ]);

  // ANSI color codes
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
  };

  // Thống kê cuối cùng
  console.log('\n' + '='.repeat(60));
  console.log('🎉 OPTIMIZED MOCK DATA GENERATION COMPLETED!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${colors.green}${usersResult.count} new${colors.reset} / ${colors.cyan}${allUsers.length} total${colors.reset}`);
  console.log(`   - Fabric Categories: ${colors.green}${categoriesResult.count} new${colors.reset} / ${colors.cyan}${allCategories.length} total${colors.reset}`);
  console.log(`   - Fabric Colors: ${colors.green}${colorsResult.count} new${colors.reset} / ${colors.cyan}${allColors.length} total${colors.reset}`);
  console.log(`   - Fabric Gloss Levels: ${colors.green}${glossesResult.count} new${colors.reset} / ${colors.cyan}${allGlosses.length} total${colors.reset}`);
  console.log(`   - Suppliers: ${colors.green}${suppliersResult.count} new${colors.reset} / ${colors.cyan}${allSuppliers.length} total${colors.reset}`);
  console.log(`   - Warehouses: ${colors.green}${warehousesResult.count} new${colors.reset} / ${colors.cyan}${allWarehouses.length} total${colors.reset}`);
  console.log(`   - Stores: ${colors.green}${storesResult.count} new${colors.reset} / ${colors.cyan}${allStores.length} total${colors.reset}`);
  console.log(`   - Shelves: ${colors.green}${shelvesResult.count} new${colors.reset} / ${colors.cyan}${allShelves.length} total${colors.reset}`);
  console.log(`   - Fabrics: ${colors.green}${fabricsResult.count} new${colors.reset} / ${colors.cyan}${allFabrics.length} total${colors.reset}`);
  console.log(`   - Fabric-Shelf Relationships: ${colors.green}${fabricShelvesResult.count} new${colors.reset} / ${colors.cyan}${totalFabricShelves} total${colors.reset}`);
  console.log(`   - Fabric-Store Relationships: ${colors.green}${fabricStoresResult.count} new${colors.reset} / ${colors.cyan}${totalFabricStores} total${colors.reset}`);
  console.log(`   - Import Fabric Records: ${colors.green}${importFabricsResult.count} new${colors.reset} / ${colors.cyan}${totalImportFabrics} total${colors.reset}`);
  console.log(`   - Import Fabric Items: ${colors.green}${importItemsResult.count} new${colors.reset} / ${colors.cyan}${totalImportItems} total${colors.reset}`);
  console.log(`   - Export Fabric Records: ${colors.green}${exportFabricsResult.count} new${colors.reset} / ${colors.cyan}${totalExportFabrics} total${colors.reset}`);
  console.log(`   - Export Fabric Items: ${colors.green}${exportItemsResult.count} new${colors.reset} / ${colors.cyan}${totalExportItems} total${colors.reset}`);
  console.log(`   - Warehouse Managers: ${colors.green}${warehouseManagesResult.count} new${colors.reset} / ${colors.cyan}${totalWarehouseManages} total${colors.reset}`);
  console.log(`   - Orders: ${colors.green}${ordersResult.count} new${colors.reset} / ${colors.cyan}${totalOrders} total${colors.reset}`);
  console.log(`   - Order Items: ${colors.green}${orderItemsResult.count} new${colors.reset} / ${colors.cyan}${totalOrderItems} total${colors.reset}`);
  console.log(`   - Invoices: ${colors.green}${invoicesResult.count} new${colors.reset} / ${colors.cyan}${totalInvoices} total${colors.reset}`);
  console.log(`   - Payments: ${colors.green}${paymentsResult.count} new${colors.reset} / ${colors.cyan}${totalPayments} total${colors.reset}`);
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during mock data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
