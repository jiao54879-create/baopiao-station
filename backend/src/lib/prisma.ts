// Prisma 客户端单例 - 独立于 Express 服务器
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };
