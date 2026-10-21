import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/, 'cor hex'],
  [
    /\b(?:bg|text|border|ring|fill|stroke|outline|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/,
    'paleta fixa do Tailwind',
  ],
  [/\b(?:bg|text|border|ring|fill|stroke)-\[(?:#|rgb|hsl|oklch|var\()/, 'cor arbitrária'],
  [/\b(?:bg|text|border)-(?:black|white)\b/, 'preto/branco fixo'],
];

const isChecked = (name) => /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name);
const files = [];
function walk(path) {
  if (!statSync(path).isDirectory()) {
    if (isChecked(path)) files.push(path);
    return;
  }
  for (const name of readdirSync(path)) walk(join(path, name));
}
for (const target of process.argv.slice(2).length ? process.argv.slice(2) : ['src']) walk(target);

const problems = [];
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [regex, label] of RULES) {
        if (regex.test(line)) problems.push(`${file}:${i + 1}  ${label}: ${line.trim()}`);
      }
    });
}

if (problems.length > 0) {
  console.error('Design system: use tokens semânticos (bg-card, text-warning...). Encontrado:');
  console.error(problems.join('\n'));
  process.exit(1);
}
