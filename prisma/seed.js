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

  // 4. Tạo triggers cho WarehouseFabricStock
  console.log('\nCreating database triggers...');
  await createWarehouseFabricStockTriggers();
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
  

