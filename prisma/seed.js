import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { allPermissionObjects, ROLE_PERMISSIONS } from '../src/constants/permissions.js';

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
      username: 'admin',
      password: hashedAdminPassword,
      email: 'admin@example.com',
      phone: '0123456789',
      fullname: 'System Administrator',
      status: 'ACTIVE',
      role: createdRoles.ADMIN.name
    }
  });

  // Regular user
  const hashedUserPassword = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: hashedUserPassword,
      email: 'user@example.com',
      phone: '0987654321',
      fullname: 'Regular User',
      status: 'ACTIVE',
      role: createdRoles.USER.name
    }
  });

  // Staff user
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);
  const staffUser = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: hashedStaffPassword,
      email: 'staff@example.com',
      phone: '0555666777',
      fullname: 'System Staff',
      status: 'ACTIVE',
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
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });