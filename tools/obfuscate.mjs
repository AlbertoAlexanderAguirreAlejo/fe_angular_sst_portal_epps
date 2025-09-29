import { globby } from 'globby';
import { readFile, writeFile, stat } from 'node:fs/promises';
import JavaScriptObfuscator from 'javascript-obfuscator';
import path from 'node:path';

const DIST_DIR = 'dist';
const FILES = [
  `${DIST_DIR}/**/*.js`,
  `!${DIST_DIR}/**/*.map`,
  `!${DIST_DIR}/**/worker-*.js`,
];

const OBFUSCATE = {
  compact: true,
  selfDefending: true,
  stringArray: true,
  stringArrayThreshold: 0.75,
};

const files = await globby(FILES);
for (const f of files) {
  const { size } = await stat(f);
  if (size < 1024) continue;

  const code = await readFile(f, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATE);
  await writeFile(f, result.getObfuscatedCode(), 'utf8');
  console.log('Ofuscado:', path.relative('.', f));
}
console.log(`Ofuscación completa (${files.length} archivos candidatos).`);
