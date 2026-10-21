import 'dotenv/config';
import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { validateEnv } from '../src/config/env.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedDatabase } from './seed-data.js';

const env = validateEnv(process.env);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

try {
  await seedDatabase(prisma);
  console.log('Seed carregado: 3 vendedores e 7 oportunidades.');
} finally {
  await prisma.$disconnect();
}
