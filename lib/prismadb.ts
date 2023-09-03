import { PrismaClient } from '@prisma/client';

// in here, weadded prisma to global this
declare global {
    var prisma: PrismaClient | undefined
};

// we don't just use new PrismaClient();
// because next13 will just create a bunch of Client in that case.
const prismadb = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismadb;

export default prismadb;