import { execFileSync } from 'node:child_process';

export async function readStdinJson() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

export function appOf(root, filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const base = root.replaceAll('\\', '/');
  const rel = normalized.toLowerCase().startsWith(base.toLowerCase())
    ? normalized.slice(base.length + 1)
    : normalized;
  const match = /^apps\/(api|web)\/(.+)$/.exec(rel);
  return match
    ? { app: match[1], relToApp: match[2], relToRoot: rel }
    : { app: null, relToRoot: rel };
}
