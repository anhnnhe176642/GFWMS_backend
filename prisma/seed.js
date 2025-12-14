import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { allPermissionObjects, ROLE_PERMISSIONS } from '../src/constants/permissions.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Tạo tất cả permissions
  console.log('Creating permissions...');
  const permissions = allPermissionObjects();
  const createdPermissions = [];
  
  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description
      },
      create: {
        key: permission.key,
        description: permission.description
      }
    });
    createdPermissions.push(createdPermission);
  }
  console.log(`Created ${createdPermissions.length} permissions`);

  // 2. Tạo roles và role permissions tự động từ ROLE_PERMISSIONS
  console.log('Creating roles and role permissions...');
  const createdRoles = {};
  
  for (const [roleKey, roleConfig] of Object.entries(ROLE_PERMISSIONS)) {
    // Tạo role
    const role = await prisma.role.upsert({
      where: { name: roleConfig.name },
      update: {},
      create: {
        name: roleConfig.name
      }
    });
    createdRoles[roleKey] = role;
    console.log(`Created role: ${role.name}`);

    // Tạo role permissions
    for (const permissionKey of roleConfig.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { key: permissionKey }
      });
      
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role.name,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            role: role.name,
            permissionId: permission.id
          }
        });
      }
    }
    console.log(`Assigned ${roleConfig.permissions.length} permissions to ${role.name}`);
  }

  // 3. Tạo users mặc định
  console.log('Creating default users...');
  
  // Admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'a0000000-0000-4000-8000-000000000001',
      username: 'admin',
      password: hashedAdminPassword,
      email: 'admin@example.com',
      phone: '0123456789',
      fullname: 'System Administrator',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      role: createdRoles.ADMIN.name
    }
  });

  // Regular user
  const hashedUserPassword = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      id: 'a0000000-0000-4000-8000-000000000002',
      username: 'user',
      password: hashedUserPassword,
      email: 'user@example.com',
      phone: '0987654321',
      fullname: 'Regular User',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      role: createdRoles.USER.name
    }
  });

  // Staff user
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);
  const staffUser = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      id: 'a0000000-0000-4000-8000-000000000003',
      username: 'staff',
      password: hashedStaffPassword,
      email: 'staff@example.com',
      phone: '0555666777',
      fullname: 'System Staff',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      role: createdRoles.STAFF.name
    }
  });

  console.log('Seed completed successfully!');
  console.log('Created roles:', Object.entries(createdRoles).map(([key, role]) => ({ 
    key, 
    name: role.name 
  })));
  console.log('Created users:', {
    admin: { id: adminUser.id, username: adminUser.username },
    user: { id: regularUser.id, username: regularUser.username },
    staff: { id: staffUser.id, username: staffUser.username }
  });
  console.log('Default login credentials:');
  console.log('- Admin: username="admin", password="admin123"');
  console.log('- User: username="user", password="user123"');
  console.log('- Staff: username="staff", password="staff123"');

  // 4. Tạo triggers cho WarehouseFabricStock và FabricCustomer
  console.log('\nCreating database triggers...');
  await createWarehouseFabricStockTriggers();
  await createFabricCustomerTriggers();
  console.log('Triggers created successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Tạo triggers cho WarehouseFabricStock
 * Dùng mysql2/promise để kết nối trực tiếp (không bị hạn chế bởi prepared statements)
 */
async function createWarehouseFabricStockTriggers() {
  let connection;
  try {
    // Parse DATABASE_URL
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const config = {
      host: databaseUrl.hostname,
      user: databaseUrl.username,
      password: databaseUrl.password,
      database: databaseUrl.pathname.slice(1),
      port: databaseUrl.port ? parseInt(databaseUrl.port) : 3306
    };

    connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL for trigger creation');

    // Mảng các SQL statements
    const triggerStatements = [
      // Trigger INSERT
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_shelf_after_insert
      AFTER INSERT ON fabric_shelf
      FOR EACH ROW
      BEGIN
          DECLARE v_warehouse_id INT;
          
          SELECT warehouseId INTO v_warehouse_id 
          FROM shelf 
          WHERE id = NEW.shelfId;
          
          INSERT INTO warehouse_fabric_stock (warehouseId, fabricId, currentStock, createdAt, updatedAt)
          VALUES (v_warehouse_id, NEW.fabricId, NEW.quantity, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
              currentStock = currentStock + NEW.quantity,
              updatedAt = NOW();
      END`,

      // Trigger UPDATE
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_shelf_after_update
      AFTER UPDATE ON fabric_shelf
      FOR EACH ROW
      BEGIN
          DECLARE v_warehouse_id INT;
          DECLARE v_quantity_diff INT;
          
          IF OLD.quantity != NEW.quantity THEN
              SELECT warehouseId INTO v_warehouse_id 
              FROM shelf 
              WHERE id = NEW.shelfId;
              
              SET v_quantity_diff = NEW.quantity - OLD.quantity;
              
              UPDATE warehouse_fabric_stock 
              SET currentStock = GREATEST(0, currentStock + v_quantity_diff),
                  updatedAt = NOW()
              WHERE warehouseId = v_warehouse_id 
                AND fabricId = NEW.fabricId;
          END IF;
      END`,

      // Trigger DELETE
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_shelf_after_delete
      AFTER DELETE ON fabric_shelf
      FOR EACH ROW
      BEGIN
          DECLARE v_warehouse_id INT;
          
          SELECT warehouseId INTO v_warehouse_id 
          FROM shelf 
          WHERE id = OLD.shelfId;
          
          UPDATE warehouse_fabric_stock 
          SET currentStock = GREATEST(0, currentStock - OLD.quantity),
              updatedAt = NOW()
          WHERE warehouseId = v_warehouse_id 
            AND fabricId = OLD.fabricId;
      END`,

      // Procedure SYNC
      `CREATE PROCEDURE IF NOT EXISTS sp_sync_warehouse_fabric_stock()
      BEGIN
          DELETE FROM warehouse_fabric_stock;
          
          INSERT INTO warehouse_fabric_stock (warehouseId, fabricId, currentStock, createdAt, updatedAt)
          SELECT 
              s.warehouseId,
              fs.fabricId,
              SUM(fs.quantity) as currentStock,
              NOW() as createdAt,
              NOW() as updatedAt
          FROM fabric_shelf fs
          INNER JOIN shelf s ON fs.shelfId = s.id
          GROUP BY s.warehouseId, fs.fabricId;
      END`
    ];

    // Thực hiện từng statement
    for (const statement of triggerStatements) {
      try {
        await connection.query(statement);
        const triggerName = statement.match(/(?:TRIGGER|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/)?.[1];
        console.log(`✓ Created: ${triggerName}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`Error creating trigger:`, error.message);
        }
      }
    }

    console.log('✓ All triggers and procedures created successfully');
  } catch (error) {
    console.error('Error connecting to MySQL for triggers:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Tạo triggers cho FabricCustomer và FabricCustomerStore
 * Đồng bộ dữ liệu khi có thay đổi trong fabric_store
 */
async function createFabricCustomerTriggers() {
  let connection;
  try {
    // Parse DATABASE_URL
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const config = {
      host: databaseUrl.hostname,
      user: databaseUrl.username,
      password: databaseUrl.password,
      database: databaseUrl.pathname.slice(1),
      port: databaseUrl.port ? parseInt(databaseUrl.port) : 3306
    };

    connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL for FabricCustomer trigger creation');

    // Mảng các SQL statements cho FabricCustomer
    const fabricCustomerTriggerStatements = [
      // Trigger INSERT vào fabric_store -> Tạo/cập nhật FabricCustomer và FabricCustomerStore
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_store_after_insert
      AFTER INSERT ON fabric_store
      FOR EACH ROW
      BEGIN
          DECLARE v_fabric_customer_id INT;
          DECLARE v_existing_customer_id INT;
          
          -- Tìm kiếm FabricCustomer có cùng thuộc tính với Fabric
          SELECT fc.id INTO v_existing_customer_id
          FROM fabric_customer fc
          INNER JOIN fabric f ON f.id = NEW.fabricId
          WHERE fc.thickness = f.thickness
            AND fc.glossId = f.glossId
            AND fc.width = f.width
            AND fc.length = f.length
            AND fc.categoryId = f.categoryId
            AND fc.colorId = f.colorId
          LIMIT 1;
          
          IF v_existing_customer_id IS NOT NULL THEN
              -- Cập nhật FabricCustomer nếu đã tồn tại
              SET v_fabric_customer_id = v_existing_customer_id;
              UPDATE fabric_customer
              SET totalUncut = totalUncut + NEW.uncutRolls,
                  totalCuttingMeters = totalCuttingMeters + NEW.cuttingRollMeters,
                  totalMeters = (totalUncut + NEW.uncutRolls) * length + (totalCuttingMeters + NEW.cuttingRollMeters),
                  updatedAt = NOW()
              WHERE id = v_fabric_customer_id;
              
              -- Cập nhật hoặc tạo FabricCustomerStore
              INSERT INTO fabric_customer_store (fabricCustomerId, storeId, uncutRolls, cuttingRollMeters, createdAt, updatedAt)
              VALUES (v_fabric_customer_id, NEW.storeId, NEW.uncutRolls, NEW.cuttingRollMeters, NOW(), NOW())
              ON DUPLICATE KEY UPDATE
                  uncutRolls = uncutRolls + NEW.uncutRolls,
                  cuttingRollMeters = cuttingRollMeters + NEW.cuttingRollMeters,
                  updatedAt = NOW();
          ELSE
              -- Tạo mới FabricCustomer từ Fabric
              INSERT INTO fabric_customer (thickness, glossId, width, length, categoryId, colorId, totalUncut, totalCuttingMeters, totalMeters, createdAt, updatedAt)
              SELECT f.thickness, f.glossId, f.width, f.length, f.categoryId, f.colorId, 
                     NEW.uncutRolls, NEW.cuttingRollMeters, NEW.uncutRolls * f.length + NEW.cuttingRollMeters, NOW(), NOW()
              FROM fabric f
              WHERE f.id = NEW.fabricId;
              
              -- Lấy ID của FabricCustomer vừa tạo
              SET v_fabric_customer_id = LAST_INSERT_ID();
              
              -- Tạo FabricCustomerStore
              INSERT INTO fabric_customer_store (fabricCustomerId, storeId, uncutRolls, cuttingRollMeters, createdAt, updatedAt)
              VALUES (v_fabric_customer_id, NEW.storeId, NEW.uncutRolls, NEW.cuttingRollMeters, NOW(), NOW());
          END IF;
      END`,

      // Trigger UPDATE fabric_store -> Cập nhật FabricCustomer và FabricCustomerStore
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_store_after_update
      AFTER UPDATE ON fabric_store
      FOR EACH ROW
      BEGIN
          DECLARE v_fabric_customer_id INT;
          DECLARE v_existing_customer_id INT;
          DECLARE v_uncut_diff INT;
          DECLARE v_cutting_diff FLOAT;
          DECLARE v_new_total_uncut INT;
          DECLARE v_new_total_cutting FLOAT;
          DECLARE v_length FLOAT;
          
          -- Tính sự khác biệt
          SET v_uncut_diff = NEW.uncutRolls - OLD.uncutRolls;
          SET v_cutting_diff = NEW.cuttingRollMeters - OLD.cuttingRollMeters;
          
          -- Tìm kiếm FabricCustomer có cùng thuộc tính
          SELECT fc.id, fc.length INTO v_existing_customer_id, v_length
          FROM fabric_customer fc
          INNER JOIN fabric f ON f.id = NEW.fabricId
          WHERE fc.thickness = f.thickness
            AND fc.glossId = f.glossId
            AND fc.width = f.width
            AND fc.length = f.length
            AND fc.categoryId = f.categoryId
            AND fc.colorId = f.colorId
          LIMIT 1;
          
          IF v_existing_customer_id IS NOT NULL THEN
              SET v_fabric_customer_id = v_existing_customer_id;
              SET v_new_total_uncut = GREATEST(0, (SELECT totalUncut FROM fabric_customer WHERE id = v_fabric_customer_id) + v_uncut_diff);
              SET v_new_total_cutting = GREATEST(0, (SELECT totalCuttingMeters FROM fabric_customer WHERE id = v_fabric_customer_id) + v_cutting_diff);
              
              -- Cập nhật FabricCustomer
              UPDATE fabric_customer
              SET totalUncut = v_new_total_uncut,
                  totalCuttingMeters = v_new_total_cutting,
                  totalMeters = v_new_total_uncut * v_length + v_new_total_cutting,
                  updatedAt = NOW()
              WHERE id = v_fabric_customer_id;
              
              -- Cập nhật FabricCustomerStore
              UPDATE fabric_customer_store
              SET uncutRolls = GREATEST(0, uncutRolls + v_uncut_diff),
                  cuttingRollMeters = GREATEST(0, cuttingRollMeters + v_cutting_diff),
                  updatedAt = NOW()
              WHERE fabricCustomerId = v_fabric_customer_id
                AND storeId = NEW.storeId;
          END IF;
      END`,

      // Trigger DELETE fabric_store -> Cập nhật FabricCustomer và xóa FabricCustomerStore nếu cần
      `CREATE TRIGGER IF NOT EXISTS trg_fabric_store_after_delete
      AFTER DELETE ON fabric_store
      FOR EACH ROW
      BEGIN
          DECLARE v_fabric_customer_id INT;
          DECLARE v_existing_customer_id INT;
          DECLARE v_new_total_uncut INT;
          DECLARE v_new_total_cutting FLOAT;
          DECLARE v_length FLOAT;
          
          -- Tìm kiếm FabricCustomer có cùng thuộc tính
          SELECT fc.id, fc.length INTO v_existing_customer_id, v_length
          FROM fabric_customer fc
          INNER JOIN fabric f ON f.id = OLD.fabricId
          WHERE fc.thickness = f.thickness
            AND fc.glossId = f.glossId
            AND fc.width = f.width
            AND fc.length = f.length
            AND fc.categoryId = f.categoryId
            AND fc.colorId = f.colorId
          LIMIT 1;
          
          IF v_existing_customer_id IS NOT NULL THEN
              SET v_fabric_customer_id = v_existing_customer_id;
              SET v_new_total_uncut = GREATEST(0, (SELECT totalUncut FROM fabric_customer WHERE id = v_fabric_customer_id) - OLD.uncutRolls);
              SET v_new_total_cutting = GREATEST(0, (SELECT totalCuttingMeters FROM fabric_customer WHERE id = v_fabric_customer_id) - OLD.cuttingRollMeters);
              
              -- Cập nhật FabricCustomer
              UPDATE fabric_customer
              SET totalUncut = v_new_total_uncut,
                  totalCuttingMeters = v_new_total_cutting,
                  totalMeters = v_new_total_uncut * v_length + v_new_total_cutting,
                  updatedAt = NOW()
              WHERE id = v_fabric_customer_id;
              
              -- Xóa FabricCustomerStore
              DELETE FROM fabric_customer_store
              WHERE fabricCustomerId = v_fabric_customer_id
                AND storeId = OLD.storeId;
          END IF;
      END`,

      // Procedure đồng bộ lại toàn bộ dữ liệu
      `CREATE PROCEDURE IF NOT EXISTS sp_sync_fabric_customer()
      BEGIN
          -- Xóa toàn bộ dữ liệu cũ
          DELETE FROM fabric_customer_store;
          DELETE FROM fabric_customer;
          
          -- Tạo FabricCustomer từ các bản ghi FabricStore duy nhất
          INSERT INTO fabric_customer (thickness, glossId, width, length, categoryId, colorId, totalUncut, totalCuttingMeters, totalMeters, createdAt, updatedAt)
          SELECT DISTINCT 
              f.thickness,
              f.glossId,
              f.width,
              f.length,
              f.categoryId,
              f.colorId,
              0,
              0,
              0,
              NOW(),
              NOW()
          FROM fabric f
          WHERE EXISTS (
              SELECT 1 FROM fabric_store fs WHERE fs.fabricId = f.id
          );
          
          -- Tạo FabricCustomerStore từ FabricStore
          INSERT INTO fabric_customer_store (fabricCustomerId, storeId, uncutRolls, cuttingRollMeters, createdAt, updatedAt)
          SELECT 
              fc.id,
              fs.storeId,
              fs.uncutRolls,
              fs.cuttingRollMeters,
              NOW(),
              NOW()
          FROM fabric_store fs
          INNER JOIN fabric f ON fs.fabricId = f.id
          INNER JOIN fabric_customer fc ON 
              fc.thickness = f.thickness
              AND fc.glossId = f.glossId
              AND fc.width = f.width
              AND fc.length = f.length
              AND fc.categoryId = f.categoryId
              AND fc.colorId = f.colorId;
          
          -- Cập nhật tổng số lượng và totalMeters trong FabricCustomer
          UPDATE fabric_customer fc
          SET fc.totalUncut = (
              SELECT SUM(fcs.uncutRolls) 
              FROM fabric_customer_store fcs 
              WHERE fcs.fabricCustomerId = fc.id
          ),
          fc.totalCuttingMeters = (
              SELECT SUM(fcs.cuttingRollMeters) 
              FROM fabric_customer_store fcs 
              WHERE fcs.fabricCustomerId = fc.id
          ),
          fc.totalMeters = (
              SELECT SUM(fcs.uncutRolls * fc.length + fcs.cuttingRollMeters)
              FROM fabric_customer_store fcs
              WHERE fcs.fabricCustomerId = fc.id
          ),
          fc.updatedAt = NOW();
      END`
    ];

    // Thực hiện từng statement
    for (const statement of fabricCustomerTriggerStatements) {
      try {
        await connection.query(statement);
        const triggerName = statement.match(/(?:TRIGGER|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/)?.[1];
        console.log(`✓ Created: ${triggerName}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`Error creating trigger:`, error.message);
        }
      }
    }

    console.log('✓ All FabricCustomer triggers and procedures created successfully');
  } catch (error) {
    console.error('Error connecting to MySQL for FabricCustomer triggers:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
  

