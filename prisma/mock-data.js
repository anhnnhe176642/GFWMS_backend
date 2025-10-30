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
  console.log(`   - Shelves per Warehouse: ${CONFIG.SHELVES_PER_WAREHOUSE}\n`);

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
    const username = `user_${faker.string.alphanumeric(8).toLowerCase()}_${Date.now()}_${i}`;
    const email = `user_${Date.now()}_${i}_${faker.string.alphanumeric(6)}@test.com`.toLowerCase();
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
      : `${faker.commerce.productMaterial()} Fabric ${Date.now()}_${i}`;
    
    if (!existingCategoryNames.has(name)) {
      categoriesToCreate.push({
        name,
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
    const colorId = `CLR${Date.now()}${i}`.substring(0, 50);
    const name = i < colorNames.length 
      ? colorNames[i] 
      : `${faker.color.human()} ${Date.now()}_${i}`;
    
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
      : `Gloss Level ${Date.now()}_${i}`;
    
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
      : `Warehouse ${faker.location.city()} ${Date.now()}_${i}`;
    
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
      : `Store ${faker.location.city()} ${Date.now()}_${i}`;
    
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
      const code = `${warehouse.name.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(4).toUpperCase()}-${Date.now()}-${i}`;
      
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

  // Lấy tổng số cho các bảng relationships
  console.log('\n📊 Counting total records...');
  const [totalFabricShelves, totalFabricStores, totalImportFabrics, totalImportItems, totalExportFabrics, totalExportItems, totalWarehouseManages] = await Promise.all([
    prisma.fabricShelf.count(),
    prisma.fabricStore.count(),
    prisma.importFabric.count(),
    prisma.importFabricItem.count(),
    prisma.exportFabric.count(),
    prisma.exportFabricItem.count(),
    prisma.warehouseManage.count(),
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
