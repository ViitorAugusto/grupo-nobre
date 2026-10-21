import { basename } from 'node:path';
import { readStdinJson } from './lib.mjs';

const input = await readStdinJson();
const filePath = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? '';
const name = basename(filePath).toLowerCase();

const sensitive =
  (/^\.env(\..+)?$/.test(name) && name !== '.env.example') ||
  /\.(pem|key|p12|pfx)$/.test(name) ||
  /^(id_rsa|id_ed25519|credentials(\.json)?)$/.test(name);

if (sensitive) {
  console.error(
    `Bloqueado: "${filePath}" é um arquivo sensível (ambiente real ou credencial). ` +
      'Altere o .env.example correspondente e peça ao desenvolvedor para ajustar o arquivo real.',
  );
  process.exit(2);
}
