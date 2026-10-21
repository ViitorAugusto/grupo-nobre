import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import pg from 'pg';

const E2E_LOCK_KEY = 20261015;

export default async function setup(): Promise<() => Promise<void>> {
  config({ quiet: true });
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('Defina DATABASE_URL_TEST (veja apps/api/.env.example).');
  process.env.DATABASE_URL = url;

  const lock = new pg.Client({ connectionString: url });
  await lock.connect();
  const { rows } = await lock.query<{ free: boolean }>('SELECT pg_try_advisory_lock($1) AS free', [
    E2E_LOCK_KEY,
  ]);
  if (!rows[0].free) {
    console.log('Outra execução e2e está usando o banco de teste. Aguardando a vez...');
    await lock.query('SELECT pg_advisory_lock($1)', [E2E_LOCK_KEY]);
  }

  execSync('prisma migrate deploy', { stdio: 'inherit', env: process.env });

  return async () => {
    await lock.query('SELECT pg_advisory_unlock($1)', [E2E_LOCK_KEY]);
    await lock.end();
  };
}
