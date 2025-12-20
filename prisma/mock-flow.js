/**
 * Mock Flow Data Generator
 * 
 * Luồng xử lý:
 * 1. Lấy dữ liệu từ các bảng: user, category, color, gloss, warehouse, store
 * 2. Tạo đơn nhập (5-10 vải, số lượng 5-10, giá 500.000 - 700.000)
 * 3. Phân bổ vải vào kệ (tạo thêm kệ nếu không đủ, tối đa 100)
 * 4. Tạo phiếu xuất kho ngẫu nhiên
 * 5. Duyệt hoặc từ chối phiếu xuất
 * 6. Nhân viên cửa hàng xác nhận đơn hàng
 * 
 * Usage:
 *   node prisma/mock-flow.js                  # Run 1 iteration
 *   node prisma/mock-flow.js --count=5        # Run 5 iterations
 *   node prisma/mock-flow.js --count=10       # Run 10 iterations
 */

import { PrismaClient } from '@prisma/client';
import { importFabricService } from '../src/services/importFabric.service.js';
import { fabricShelfService } from '../src/services/fabricShelf.service.js';
import { shelfService } from '../src/services/shelf.service.js';
import { warehouseService } from '../src/services/warehouse.service.js';
import * as exportFabricService from '../src/services/exportFabric.service.js';
import { PERMISSIONS } from '../src/constants/permissions.js';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find(arg => arg.startsWith('--count='));
const ITERATION_COUNT = countArg ? parseInt(countArg.split('=')[1]) || 1 : 1;

// Helper: Random integer trong khoảng [min, max]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Random element từ array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Random nhiều elements từ array (không trùng)
const randomElements = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

// Helper: Get display name for user
const getUserDisplayName = (user) => user?.fullname || user?.username || 'Unknown';

// =============================================
// STEP 1: Lấy dữ liệu cần thiết
// =============================================
async function fetchBaseData() {
  console.log('\n📦 STEP 1: Fetching base data...');

  // Lấy tất cả users với role và permissions
  const allUsers = await prisma.user.findMany({
    include: {
      roleRel: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  // Filter users có quyền import_fabrics:create
  const usersWithImportPermission = allUsers.filter(user => {
    return user.roleRel?.rolePermissions?.some(rp => 
      rp.permission.key === PERMISSIONS.IMPORT_FABRICS.CREATE.key
    );
  });

  // Filter users có quyền export_fabrics:create
  const usersWithExportPermission = allUsers.filter(user => {
    return user.roleRel?.rolePermissions?.some(rp => 
      rp.permission.key === 'export_fabrics:create'
    );
  });

  // Filter users có quyền export_fabrics:approve (nhân viên kho)
  const usersWithApprovePermission = allUsers.filter(user => {
    return user.roleRel?.rolePermissions?.some(rp => 
      rp.permission.key === 'export_fabrics:approve'
    );
  });

  // Filter users có quyền export_fabrics:receive (nhân viên cửa hàng)
  const usersWithReceivePermission = allUsers.filter(user => {
    return user.roleRel?.rolePermissions?.some(rp => 
      rp.permission.key === 'export_fabrics:receive'
    );
  });

  const categories = await prisma.fabricCategory.findMany();
  const colors = await prisma.fabricColor.findMany();
  const glosses = await prisma.fabricGloss.findMany();
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true } });
  const warehouses = await prisma.warehouse.findMany({ where: { status: 'ACTIVE' } });
  const stores = await prisma.store.findMany({ where: { isActive: true } });
  const shelves = await prisma.shelf.findMany();

  console.log(`    Users with import permission: ${usersWithImportPermission.length}`);
  console.log(`    Users with export permission: ${usersWithExportPermission.length}`);
  console.log(`    Users with approve permission: ${usersWithApprovePermission.length}`);
  console.log(`    Users with receive permission: ${usersWithReceivePermission.length}`);
  console.log(`    Categories: ${categories.length}`);
  console.log(`    Colors: ${colors.length}`);
  console.log(`    Glosses: ${glosses.length}`);
  console.log(`    Suppliers: ${suppliers.length}`);
  console.log(`    Warehouses: ${warehouses.length}`);
  console.log(`    Stores: ${stores.length}`);
  console.log(`    Shelves: ${shelves.length}`);

  if (usersWithImportPermission.length === 0) {
    throw new Error('Không tìm thấy user nào có quyền tạo đơn nhập. Hãy chạy seed trước.');
  }

  if (categories.length === 0 || colors.length === 0 || glosses.length === 0 || suppliers.length === 0) {
    throw new Error('Thiếu dữ liệu cơ bản (categories, colors, glosses, suppliers). Hãy chạy seed/mock-data trước.');
  }

  if (warehouses.length === 0 || stores.length === 0) {
    throw new Error('Thiếu dữ liệu warehouses hoặc stores. Hãy chạy seed/mock-data trước.');
  }

  return {
    usersWithImportPermission,
    usersWithExportPermission,
    usersWithApprovePermission,
    usersWithReceivePermission,
    allUsers,
    categories,
    colors,
    glosses,
    suppliers,
    warehouses,
    stores,
    shelves
  };
}

// =============================================
// STEP 2: Tạo đơn nhập vải
// =============================================
async function createImportFabric(data) {
  console.log('\n📥 STEP 2: Creating import fabric order...');

  const { usersWithImportPermission, categories, colors, glosses, suppliers, warehouses } = data;

  // Chọn ngẫu nhiên người nhập
  const importer = randomElement(usersWithImportPermission);
  const warehouse = randomElement(warehouses);
  
  // Tạo 5-10 loại vải
  const itemCount = randomInt(5, 10);
  const items = [];

  // Các giá trị vải ngẫu nhiên
  const thicknessValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  const lengthValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const widthValues = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];

  for (let i = 0; i < itemCount; i++) {
    items.push({
      thickness: randomElement(thicknessValues),
      glossId: randomElement(glosses).id,
      length: randomElement(lengthValues),
      width: randomElement(widthValues),
      weight: parseFloat((Math.random() * 9.5 + 0.5).toFixed(1)),
      categoryId: randomElement(categories).id,
      colorId: randomElement(colors).id,
      supplierId: randomElement(suppliers).id,
      quantity: randomInt(5, 10),
      price: randomInt(500000, 700000)
    });
  }

  console.log(`   📋 Creating import with ${itemCount} fabric items...`);
  console.log(`   👤 Importer: ${getUserDisplayName(importer)} (${importer.id})`);
  console.log(`   🏢 Warehouse: ${warehouse.name} (ID: ${warehouse.id})`);

  // Gọi service tạo đơn nhập
  const importData = {
    warehouseId: warehouse.id,
    importer: importer.id
  };

  const mockUser = { id: importer.id };
  const createdImport = await importFabricService.createImport(importData, items, mockUser);

  console.log(`    Created ImportFabric ID: ${createdImport.id}`);
  console.log(`   💰 Total Price: ${createdImport.totalPrice.toLocaleString('vi-VN')} VND`);

  return { createdImport, warehouse, importer };
}

// =============================================
// STEP 3: Phân bổ vải vào kệ
// =============================================
async function allocateFabricsToShelves(importResult, data) {
  console.log('\n📦 STEP 3: Allocating fabrics to shelves...');

  const { createdImport, warehouse } = importResult;
  const importFabricId = createdImport.id;

  // Lấy danh sách các item trong đơn nhập
  const importItems = await prisma.importFabricItem.findMany({
    where: { importFabricId },
    include: { fabric: true }
  });

  console.log(`   📋 Found ${importItems.length} items to allocate`);

  // Lấy danh sách kệ trong kho
  let shelves = await prisma.shelf.findMany({
    where: { warehouseId: warehouse.id },
    orderBy: { code: 'asc' }
  });

  console.log(`   🗄️ Available shelves in warehouse: ${shelves.length}`);

  // Phân bổ từng loại vải vào kệ
  for (const item of importItems) {
    const fabricId = item.fabricId;
    const quantity = item.quantity;

    console.log(`\n   🧵 Allocating Fabric ID ${fabricId} (quantity: ${quantity})...`);

    // Tìm kệ có đủ chỗ
    let allocated = 0;
    const allocations = [];
    let shelvesToCheck = [...shelves]; // Copy để thao tác

    for (const shelf of shelvesToCheck) {
      if (allocated >= quantity) break;

      const remaining = shelf.maxQuantity - shelf.currentQuantity;
      if (remaining > 0) {
        const toAllocate = Math.min(remaining, quantity - allocated);
        allocations.push({
          shelfId: shelf.id,
          quantity: toAllocate
        });
        allocated += toAllocate;
        
        // Cập nhật tạm currentQuantity để tính cho lần sau
        shelf.currentQuantity += toAllocate;
      }
    }

    // Nếu không đủ kệ, tạo thêm kệ mới
    if (allocated < quantity) {
      const neededQuantity = quantity - allocated;
      console.log(`   ⚠️ Need to create more shelves for ${neededQuantity} items...`);

      // Đếm số kệ hiện có trong kho
      const existingShelfCount = shelves.length;
      const maxShelves = 100;
      const availableNewShelves = maxShelves - existingShelfCount;

      if (availableNewShelves <= 0) {
        console.log(`   ❌ Cannot create more shelves. Max ${maxShelves} reached.`);
        throw new Error(`Không thể tạo thêm kệ. Đã đạt giới hạn ${maxShelves} kệ.`);
      }

      // Tạo kệ mới với capacity đủ chứa
      let stillNeeded = neededQuantity;
      let newShelfIndex = existingShelfCount + 1;

      while (stillNeeded > 0 && newShelfIndex <= maxShelves) {
        const shelfCode = `NEW-${warehouse.id}-${String(newShelfIndex).padStart(3, '0')}`;
        const newMaxQuantity = Math.min(100, stillNeeded + 50); // Tạo kệ với sức chứa hợp lý

        try {
          const newShelf = await shelfService.createShelf({
            code: shelfCode,
            maxQuantity: newMaxQuantity,
            warehouseId: warehouse.id
          });

          console.log(`   🆕 Created new shelf: ${shelfCode} (max: ${newMaxQuantity})`);

          const toAllocate = Math.min(newMaxQuantity, stillNeeded);
          allocations.push({
            shelfId: newShelf.id,
            quantity: toAllocate
          });
          stillNeeded -= toAllocate;
          allocated += toAllocate;

          // Thêm vào list shelves
          shelves.push({ ...newShelf, currentQuantity: toAllocate });
          newShelfIndex++;
        } catch (error) {
          if (error.message.includes('Unique constraint')) {
            // Code đã tồn tại, thử code khác
            newShelfIndex++;
            continue;
          }
          throw error;
        }
      }
    }

    // Gọi service phân bổ
    try {
      const result = await fabricShelfService.assignFabricToShelves({
        fabricId,
        importFabricId,
        shelves: allocations
      });
      console.log(`    Allocated to ${allocations.length} shelves`);
    } catch (error) {
      console.log(`   ❌ Allocation error: ${error.message}`);
      throw error;
    }
  }

  // Cập nhật trạng thái đơn nhập thành COMPLETED
  await importFabricService.updateStatus(importFabricId, 'COMPLETED', importResult.importer.id);
  console.log(`\n    Import #${importFabricId} marked as COMPLETED`);

  return { importFabricId };
}

// =============================================
// STEP 4: Tạo phiếu xuất kho
// =============================================
async function createExportFabric(data) {
  console.log('\n📤 STEP 4: Creating export fabric order...');

  const { usersWithExportPermission, stores, allUsers } = data;

  // Lấy danh sách vải có trong kho (với số lượng thực tế từ FabricShelf)
  // Sử dụng API lấy danh sách vải có sẵn
  const fabricsWithRealStock = await prisma.fabric.findMany({
    where: { quantityInStock: { gt: 0 } },
    include: {
      category: true,
      color: true,
      gloss: true,
      supplier: true,
      fabricShelf: {
        where: { quantity: { gt: 0 } },
        include: {
          shelf: {
            include: { warehouse: true }
          }
        }
      },
      warehouseStocks: {
        where: { currentStock: { gt: 0 } },
        include: { warehouse: true }
      }
    }
  });

  // Filter chỉ lấy những fabric có thực sự có stock trong kệ VÀ quantityInStock >= realStock
  const fabricsInStock = fabricsWithRealStock.filter(f => {
    if (f.fabricShelf.length === 0) return false;
    const realStock = f.fabricShelf.reduce((sum, fs) => sum + fs.quantity, 0);
    // Đảm bảo cả quantityInStock và realStock đều > 0
    return realStock > 0 && f.quantityInStock >= realStock;
  });

  if (fabricsInStock.length === 0) {
    console.log('   ❌ No fabrics in stock. Skipping export...');
    return null;
  }

  console.log(`   📋 Found ${fabricsInStock.length} fabrics with real stock in system`);

  // Chọn ngẫu nhiên 5-15 loại vải (nhiều hơn trước đây)
  const minFabrics = 5;
  const maxFabrics = 15;
  const itemCount = randomInt(minFabrics, Math.min(maxFabrics, fabricsInStock.length));
  const selectedFabrics = randomElements(fabricsInStock, itemCount);

  const fabricItems = selectedFabrics.map(fabric => {
    // Tính tổng số lượng thực có trên kệ
    const realStock = fabric.fabricShelf.reduce((sum, fs) => sum + fs.quantity, 0);
    // Đảm bảo không lấy quá số lượng tồn kho chính thức
    const safeStock = Math.min(realStock, fabric.quantityInStock);
    // Lấy số lượng an toàn: 1-3 cuộn nhưng không vượt quá safeStock
    const maxQty = Math.min(3, safeStock);
    const qty = maxQty >= 1 ? randomInt(1, maxQty) : 1;
    return {
      fabricId: fabric.id,
      quantity: Math.min(qty, safeStock), // Đảm bảo không vượt quá tồn kho
      fabric: fabric // Giữ lại thông tin fabric để hiển thị
    };
  }).filter(item => item.quantity > 0); // Chỉ lấy những item có số lượng > 0

  console.log(`   📦 Selected ${itemCount} fabric types for export:`);
  fabricItems.forEach(item => {
    console.log(`      - Fabric #${item.fabricId}: ${item.fabric?.category?.name} (${item.fabric?.color?.name}) - qty: ${item.quantity}`);
  });

  // Chuẩn bị data cho API suggest (không kèm fabric object)
  const fabricItemsForAPI = fabricItems.map(({ fabricId, quantity }) => ({ fabricId, quantity }));

  // Gọi API suggest để lấy thông tin phân bổ kho
  console.log('\n   🔍 Calling suggest API to get warehouse allocation...');
  
  try {
    const suggestion = await exportFabricService.suggestOptimalAllocation(fabricItemsForAPI, 'MIN_WAREHOUSES');
    
    console.log(`    Suggestion received for ${suggestion.fabrics.length} fabrics`);

    // Build warehouseAllocations từ suggestion
    const warehouseMap = new Map();

    for (const fabricSuggestion of suggestion.fabrics) {
      for (const stock of fabricSuggestion.availableStocks) {
        if (stock.selected && stock.takeQuantity > 0) {
          if (!warehouseMap.has(stock.warehouseId)) {
            warehouseMap.set(stock.warehouseId, {
              warehouseId: stock.warehouseId,
              warehouseName: stock.warehouseName,
              items: []
            });
          }
          warehouseMap.get(stock.warehouseId).items.push({
            fabricId: fabricSuggestion.fabricId,
            quantity: stock.takeQuantity
          });
        }
      }
    }

    const warehouseAllocations = Array.from(warehouseMap.values());

    if (warehouseAllocations.length === 0) {
      console.log('   ⚠️ No warehouse allocations. Skipping export...');
      return null;
    }

    // Hiển thị chi tiết phân bổ theo kho
    console.log(`\n   📊 Warehouse allocation summary:`);
    warehouseAllocations.forEach(wh => {
      console.log(`      🏢 Warehouse #${wh.warehouseId} (${wh.warehouseName}): ${wh.items.length} fabric types`);
    });

    // Chọn store và người tạo
    const store = randomElement(stores);
    const creator = usersWithExportPermission.length > 0 
      ? randomElement(usersWithExportPermission) 
      : randomElement(data.allUsers);

    console.log(`\n   🏪 Store: ${store.name} (ID: ${store.id})`);
    console.log(`   👤 Creator: ${getUserDisplayName(creator)}`);
    console.log(`   📦 Warehouses involved: ${warehouseAllocations.length}`);
    console.log(`   📋 Total fabric types in request: ${fabricItemsForAPI.length}`);

    // Gọi service tạo batch export
    const batchResult = await exportFabricService.createBatchExportFabric({
      storeId: store.id,
      note: 'Mock flow export - Auto generated',
      createdById: creator.id,
      warehouseAllocations
    });

    console.log(`    Created ${batchResult.exports.length} export orders`);
    
    return {
      exports: batchResult.exports,
      store,
      creator,
      suggestion
    };
  } catch (error) {
    console.log(`   ❌ Export creation error: ${error.message}`);
    return null;
  }
}

// =============================================
// STEP 5: Xử lý phiếu xuất (duyệt hoặc từ chối)
// =============================================
async function processExportFabrics(exportResult, data) {
  console.log('\n⚙️ STEP 5: Processing export fabrics (approve/reject)...');

  if (!exportResult || !exportResult.exports || exportResult.exports.length === 0) {
    console.log('   ⚠️ No exports to process');
    return [];
  }

  const { usersWithApprovePermission, allUsers } = data;
  const processedExports = [];

  for (const exportFabric of exportResult.exports) {
    const exportId = exportFabric.id;
    const warehouseId = exportFabric.warehouseId;

    // Lấy thông tin chi tiết export để đếm số fabric
    const exportDetail = await prisma.exportFabric.findUnique({
      where: { id: exportId },
      include: {
        exportItems: {
          include: { 
            fabric: {
              include: { category: true, color: true }
            }
          }
        },
        warehouse: true
      }
    });

    if (!exportDetail) {
      console.log(`   ⚠️ Export #${exportId} not found`);
      continue;
    }

    const fabricCount = exportDetail.exportItems.length;
    const totalQuantity = exportDetail.exportItems.reduce((sum, item) => sum + item.quantity, 0);

    // Random quyết định duyệt hoặc từ chối (70% duyệt, 30% từ chối)
    const shouldApprove = Math.random() < 0.7;
    const approver = usersWithApprovePermission.length > 0 
      ? randomElement(usersWithApprovePermission) 
      : randomElement(allUsers);

    console.log(`\n   📋 Processing Export #${exportId} from ${exportDetail.warehouse?.name}...`);
    console.log(`      📦 Contains ${fabricCount} fabric types, ${totalQuantity} total rolls`);
    console.log(`   👤 Approver: ${getUserDisplayName(approver)}`);

    if (!shouldApprove) {
      // Từ chối phiếu
      console.log(`   ❌ REJECTED`);
      try {
        await exportFabricService.approveExportFabric({
          exportFabricId: exportId,
          status: 'REJECTED',
          note: 'Mock flow - Auto rejected',
          approvedById: approver.id
        });
        processedExports.push({ exportId, status: 'REJECTED', fabricCount, totalQuantity });
      } catch (error) {
        console.log(`   ⚠️ Reject error: ${error.message}`);
      }
      continue;
    }

    // Duyệt phiếu - cần lấy thông tin pickup
    console.log(`    APPROVING...`);

    // Gọi API pickup cho từng fabric
    const batchPickupDetails = [];

    for (const item of exportDetail.exportItems) {
      console.log(`      🔍 Getting pickup for Fabric #${item.fabricId} (${item.fabric?.category?.name} - ${item.fabric?.color?.name}) qty: ${item.quantity}...`);

      try {
        const pickupResult = await warehouseService.calculateOptimalPickup(
          warehouseId,
          item.fabricId,
          item.quantity,
          'OLDEST_FIRST' // FIFO
        );

        // Build batches từ pickup result
        const batches = [];
        for (const shelf of pickupResult.shelves) {
          for (const batch of shelf.batches) {
            if (batch.pickQuantity > 0) {
              batches.push({
                shelfId: batch.shelfId || shelf.shelfId,
                importId: batch.importId,
                pickQuantity: batch.pickQuantity
              });
            }
          }
        }

        if (batches.length > 0) {
          batchPickupDetails.push({
            fabricId: item.fabricId,
            batches
          });
        }
      } catch (error) {
        console.log(`   ⚠️ Pickup error for fabric ${item.fabricId}: ${error.message}`);
      }
    }

    if (batchPickupDetails.length === 0) {
      console.log(`   ⚠️ No pickup details available. Rejecting...`);
      await exportFabricService.approveExportFabric({
        exportFabricId: exportId,
        status: 'REJECTED',
        note: 'No pickup details available',
        approvedById: approver.id
      });
      processedExports.push({ exportId, status: 'REJECTED', fabricCount, totalQuantity });
      continue;
    }

    // Gọi API approve
    try {
      await exportFabricService.approveExportFabric({
        exportFabricId: exportId,
        status: 'APPROVED',
        batchPickupDetails,
        approvedById: approver.id
      });
      console.log(`    Export #${exportId} APPROVED (${fabricCount} fabrics, ${totalQuantity} rolls)`);
      processedExports.push({ exportId, status: 'APPROVED', fabricCount, totalQuantity });
    } catch (error) {
      console.log(`   ⚠️ Approve error: ${error.message}`);
      processedExports.push({ exportId, status: 'ERROR', error: error.message });
    }
  }

  return processedExports;
}

// =============================================
// STEP 6: Nhân viên cửa hàng xác nhận đơn hàng
// =============================================
async function completeExportFabrics(processedExports, data) {
  console.log('\n✅ STEP 6: Store staff confirming export orders...');

  const { usersWithReceivePermission, allUsers } = data;
  const completedExports = [];

  const approvedExports = processedExports.filter(e => e.status === 'APPROVED');

  if (approvedExports.length === 0) {
    console.log('   ⚠️ No approved exports to complete');
    return completedExports;
  }

  for (const exportInfo of approvedExports) {
    const exportId = exportInfo.exportId;
    const receiver = usersWithReceivePermission.length > 0 
      ? randomElement(usersWithReceivePermission) 
      : randomElement(allUsers);

    console.log(`\n   📋 Completing Export #${exportId}...`);
    console.log(`   👤 Receiver: ${getUserDisplayName(receiver)}`);

    try {
      await exportFabricService.completeExportFabric({
        exportFabricId: exportId,
        receivedById: receiver.id
      });
      console.log(`    Export #${exportId} COMPLETED`);
      completedExports.push({ exportId, status: 'COMPLETED' });
    } catch (error) {
      console.log(`   ⚠️ Complete error: ${error.message}`);
      completedExports.push({ exportId, status: 'ERROR', error: error.message });
    }
  }

  return completedExports;
}

// =============================================
// MAIN FUNCTION
// =============================================
async function runSingleIteration(data, iterationIndex) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`📌 ITERATION ${iterationIndex}`);
  console.log(`${'━'.repeat(60)}`);

  const stats = {
    importId: null,
    allocated: false,
    exportsCreated: 0,
    exportsApproved: 0,
    exportsRejected: 0,
    exportsCompleted: 0
  };

  try {
    // Step 2: Create import fabric
    const importResult = await createImportFabric(data);
    stats.importId = importResult.createdImport.id;

    // Step 3: Allocate fabrics to shelves
    const allocationResult = await allocateFabricsToShelves(importResult, data);
    stats.allocated = !!allocationResult;

    // Step 4: Create export fabric
    const exportResult = await createExportFabric(data);
    if (exportResult) {
      stats.exportsCreated = exportResult.exports.length;
      stats.fabricTypesRequested = exportResult.suggestion?.fabrics?.length || 0;
    }

    // Step 5: Process exports (approve/reject)
    const processedExports = await processExportFabrics(exportResult, data);
    stats.exportsApproved = processedExports.filter(e => e.status === 'APPROVED').length;
    stats.exportsRejected = processedExports.filter(e => e.status === 'REJECTED').length;
    stats.totalFabricsApproved = processedExports
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + (e.fabricCount || 0), 0);
    stats.totalRollsApproved = processedExports
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + (e.totalQuantity || 0), 0);

    // Step 6: Complete exports
    const completedExports = await completeExportFabrics(processedExports, data);
    stats.exportsCompleted = completedExports.length;

  } catch (error) {
    console.error(`   ❌ Iteration ${iterationIndex} error: ${error.message}`);
  }

  return stats;
}

async function main() {
  console.log('🚀 Starting Mock Flow Data Generation...\n');
  console.log('='.repeat(60));
  console.log(`📊 Configuration: ${ITERATION_COUNT} iteration(s)`);
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch base data (only once)
    const data = await fetchBaseData();

    const allStats = [];

    // Run iterations
    for (let i = 1; i <= ITERATION_COUNT; i++) {
      const stats = await runSingleIteration(data, i);
      allStats.push(stats);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    const totalImports = allStats.filter(s => s.importId).length;
    const totalAllocated = allStats.filter(s => s.allocated).length;
    const totalExportsCreated = allStats.reduce((sum, s) => sum + s.exportsCreated, 0);
    const totalExportsApproved = allStats.reduce((sum, s) => sum + s.exportsApproved, 0);
    const totalExportsRejected = allStats.reduce((sum, s) => sum + s.exportsRejected, 0);
    const totalExportsCompleted = allStats.reduce((sum, s) => sum + s.exportsCompleted, 0);
    const totalFabricTypesRequested = allStats.reduce((sum, s) => sum + (s.fabricTypesRequested || 0), 0);
    const totalFabricsApproved = allStats.reduce((sum, s) => sum + (s.totalFabricsApproved || 0), 0);
    const totalRollsApproved = allStats.reduce((sum, s) => sum + (s.totalRollsApproved || 0), 0);

    console.log(`   📦 Total iterations: ${ITERATION_COUNT}`);
    console.log(`    Imports created: ${totalImports}`);
    console.log(`    Allocations completed: ${totalAllocated}`);
    console.log(`    Export orders created: ${totalExportsCreated}`);
    console.log(`      - Fabric types requested: ${totalFabricTypesRequested}`);
    console.log(`      - Approved: ${totalExportsApproved} (${totalFabricsApproved} fabric types, ${totalRollsApproved} rolls)`);
    console.log(`      - Rejected: ${totalExportsRejected}`);
    console.log(`    Export orders completed: ${totalExportsCompleted}`);

    if (ITERATION_COUNT > 1) {
      console.log('\n   📋 Import IDs created:');
      allStats.forEach((s, i) => {
        console.log(`      Iteration ${i + 1}: Import #${s.importId}`);
      });
    }

    console.log('\n🎉 Mock flow completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during mock flow:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
