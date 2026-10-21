import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { seedDatabase } from '../../prisma/seed-data.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service.js';

export const API = '/api/v1';

export const MISSING_ID = '00000000-0000-4000-8000-000000000000';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService), http: () => request(app.getHttpServer()) };
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await removeHistoryFailure(prisma);
  await seedDatabase(prisma);
}

export const SIMULATED_HISTORY_FAILURE = 'falha simulada na gravação do histórico';

export async function installHistoryFailure(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION qa_fail_stage_history() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION '${SIMULATED_HISTORY_FAILURE}';
    END;
    $$ LANGUAGE plpgsql`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER qa_fail_stage_history BEFORE INSERT ON stage_history
    FOR EACH ROW EXECUTE FUNCTION qa_fail_stage_history()`);
}

export async function removeHistoryFailure(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_fail_stage_history ON stage_history');
  await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS qa_fail_stage_history()');
}

export async function opportunityIds(t: TestApp): Promise<Record<string, string>> {
  const res = await t.http().get(`${API}/opportunities`).expect(200);
  return Object.fromEntries(
    (res.body.data as { code: string; id: string }[]).map((o) => [o.code, o.id]),
  );
}

export async function sellerIds(t: TestApp): Promise<Record<string, string>> {
  const res = await t.http().get(`${API}/sellers`).expect(200);
  return Object.fromEntries(
    (res.body.data as { name: string; id: string }[]).map((s) => [s.name, s.id]),
  );
}

export function codesOf(body: { data: { code: string }[] }): string[] {
  return body.data.map((o) => o.code);
}

export function expectApiError(
  res: { status: number; body: Record<string, unknown>; text: string },
  statusCode: number,
  error: string,
): void {
  expect(res.status).toBe(statusCode);
  expect(res.body).toMatchObject({ statusCode, error, message: expect.any(String) });
  expect((res.body.message as string).length).toBeGreaterThan(0);
  expect(
    Object.keys(res.body).every((k) => ['statusCode', 'error', 'message', 'details'].includes(k)),
  ).toBe(true);
  expect(res.text).not.toMatch(/stack|prisma|select |insert |\bat .+\.(ts|js):\d+/i);
}
