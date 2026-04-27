/**
 * Railway 数据库初始化脚本
 * 创建初始管理员账号
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 检查是否已有管理员
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    console.log('管理员已存在:', existingAdmin.email);
  } else {
    // 创建管理员账号
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
      }
    });
    console.log('管理员创建成功:', admin.email);
    console.log('临时密码: admin123');
  }

  // 创建示例用户
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
      data: {
        username: '测试用户',
        email: 'test@example.com',
        passwordHash,
        role: 'MEMBER',
      }
    });
    console.log('测试账号创建成功:', user.email);
    console.log('临时密码: test123');
  }

  console.log('数据库初始化完成!');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
