import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { appOf, readStdinJson, repoRoot } from './lib.mjs';

const input = await readStdinJson();
const root = repoRoot();

const apps = new Set();
try {
  const lines = readFileSync(input.transcript_path, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.includes('"tool_use"')) continue;
    const content = JSON.parse(line)?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      const path =
        block?.type === 'tool_use' && (block.input?.file_path ?? block.input?.notebook_path);
      const { app } = path ? appOf(root, path) : {};
      if (app) apps.add(app);
    }
  }
} catch {
  process.exit(0);
}

const failures = [];
for (const app of apps) {
  for (const script of ['typecheck', 'test']) {
    const r = spawnSync('npm', ['run', script, '-w', app], {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (r.status !== 0)
      failures.push(`npm run ${script} -w ${app}\n${(r.stdout + r.stderr).slice(-3000)}`);
  }
}

if (failures.length === 0) process.exit(0);

const message = `Verificação final falhou:\n\n${failures.join('\n\n')}`;
if (input.stop_hook_active) {
  console.error(`${message}\n\nReporte esta falha ao concluir (não esconda).`);
  process.exit(0);
}
console.error(`${message}\n\nCorrija ou, se não for possível, reporte a falha explicitamente.`);
process.exit(2);
