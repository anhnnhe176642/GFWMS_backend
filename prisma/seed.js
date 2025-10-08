import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { allPermissions, ROLE_PERMISSIONS } from '../src/constants/permissions.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Tạo tất cả permissions
  console.log('Creating permissions...');
  const permissions = allPermissions();
  const createdPermissions = [];
  
  for (const permissionKey of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key: permissionKey },
      update: {},
      create: {
        key: permissionKey,
        description: `Permission: ${permissionKey}`
      }
    });
    createdPermissions.push(permission);
  }
  console.log(`Created ${createdPermissions.length} permissions`);

  // 2. Tạo roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin'
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User'
    }
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff'
    }
  });

  // 3. Tạo role permissions
  console.log('Creating role permissions...');
  
  // Admin permissions
  for (const permissionKey of ROLE_PERMISSIONS.ADMIN.permissions) {
    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey }
    });
    
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: adminRole.name,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          role: adminRole.name,
          permissionId: permission.id
        }
      });
    }
  }

  // User permissions  
  for (const permissionKey of ROLE_PERMISSIONS.USER.permissions) {
    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey }
    });
    
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: userRole.name,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          role: userRole.name,
          permissionId: permission.id
        }
      });
    }
  }

  // Staff permissions
  for (const permissionKey of ROLE_PERMISSIONS.STAFF.permissions) {
    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey }
    });
    
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: staffRole.name,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          role: staffRole.name,
          permissionId: permission.id
        }
      });
    }
  }

  // 4. Tạo users mặc định
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
      role: adminRole.name
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
      role: userRole.name
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
      role: staffRole.name
    }
  });

  console.log('Seed completed successfully!');
  console.log('Created roles:', { 
    admin: adminRole.name, 
    user: userRole.name, 
    staff: staffRole.name 
  });
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