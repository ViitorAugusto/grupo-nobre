import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env.local'],
];

for (const [example, target] of files) {
  const targetPath = join(root, target);
  if (existsSync(targetPath)) {
    console.log(`= ${target} já existe (mantido)`);
    continue;
  }
  copyFileSync(join(root, example), targetPath);
  console.log(`+ ${target} criado a partir de ${example}`);
}
