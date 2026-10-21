import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { appOf, readStdinJson, repoRoot } from './lib.mjs';

const input = await readStdinJson();
const filePath = input?.tool_input?.file_path;
if (!filePath || !existsSync(filePath)) process.exit(0);

const root = repoRoot();
const { app, relToApp, relToRoot } = appOf(root, filePath);
const run = (cmd, args, cwd) =>
  spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });

if (
  /\.(ts|tsx|mts|js|mjs|cjs|json|css|ya?ml)$/.test(relToRoot) &&
  !relToRoot.includes('generated/')
) {
  run('npx', ['prettier', '--write', '--log-level', 'warn', `"${relToRoot}"`], root);
}

if (!/\.(ts|tsx|mts)$/.test(relToRoot) || relToRoot.includes('generated/')) process.exit(0);

let result;
if (app === 'api') {
  result = run('npx', ['oxlint', '--type-aware', `"${relToApp}"`], `${root}/apps/api`);
} else if (app === 'web') {
  result = run('npx', ['eslint', '--fix', `"${relToApp}"`], `${root}/apps/web`);
  if (result.status === 0 && relToApp.startsWith('src/')) {
    result = run(
      'node',
      ['../../scripts/check-design-tokens.mjs', `"${relToApp}"`],
      `${root}/apps/web`,
    );
  }
}

if (result && result.status !== 0) {
  console.error(
    `Lint falhou em ${relToRoot}. Corrija antes de seguir:\n${result.stdout}${result.stderr}`,
  );
  process.exit(2);
}
