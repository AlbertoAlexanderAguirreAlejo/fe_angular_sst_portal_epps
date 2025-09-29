// tools/pack-war.mjs
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

// === 1) LEE appName desde environments (prod) ===============================
const ENV_FILE = path.join('src', 'environments', 'environment.ts');
let appNameFromEnv = null;

try {
  const src = fs.readFileSync(ENV_FILE, 'utf8');
  // busca: appName: 'algo'  o  appName: "algo"
  const m = src.match(/appName\s*:\s*['"]([^'"]+)['"]/);
  appNameFromEnv = m?.[1] || null;
} catch {
  // no pasa nada, caerá al fallback
}

// Permite override por CLI/ENV
const cliName = process.argv.find(a => a.startsWith('--name='))?.split('=')[1]
            || process.argv.find(a => a.startsWith('--war='))?.split('=')[1];
const envName = process.env.WAR_NAME;

// WAR_NAME final
const WAR_NAME = (cliName || envName || appNameFromEnv || 'portal_epps').replace(/[^a-zA-Z0-9_-]/g, '');

// === 2) RUTAS DE BUILD (fijas a tu proyecto actual) =========================
// Angular 20 deja el build en dist/<projectName>/browser
const BUILD_DIR_NAME = 'portal_epps'; // <- tu nombre de proyecto en angular.json
const DIST_ROOT  = path.join('dist', BUILD_DIR_NAME);
const BROWSERDIR = path.join(DIST_ROOT, 'browser');
const WAR_PATH   = path.join('dist', `${WAR_NAME}.war`);

// === 3) web.xml mínimo ======================================================
const webXml = `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee" version="3.1">
  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
  </welcome-file-list>
</web-app>
`;

// === 4) validaciones y empaquetado =========================================
function assertDir(dir, label) {
  if (!fs.existsSync(dir)) {
    console.error(`[WAR] No existe ${label}: ${dir}`);
    process.exit(1);
  }
}

assertDir(DIST_ROOT, 'la carpeta de distribución');
assertDir(BROWSERDIR, 'la carpeta "browser" del build');

const output = fs.createWriteStream(WAR_PATH);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => console.log(`[WAR] Generado: ${WAR_PATH} (${archive.pointer()} bytes)`));
archive.on('warning', err => { if (err.code === 'ENOENT') console.warn(err); else throw err; });
archive.on('error', err => { throw err; });

archive.pipe(output);
archive.directory(BROWSERDIR + path.sep, false);      // mete todo en raíz del WAR
archive.append(webXml, { name: 'WEB-INF/web.xml' });  // añade web.xml
await archive.finalize();
