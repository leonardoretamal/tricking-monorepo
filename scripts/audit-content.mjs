import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// Auditoria de contenido reproducible: compara la API viva de TrickingAPI contra la base
// de datos y reporta los conteos y los faltantes. Es SOLO LECTURA sobre la base (no escribe
// nada) y no modifica ningun archivo. Se ejecuta con `node scripts/audit-content.mjs` desde
// la raiz del monorepo.
//
// La URL de la API y el tiempo de espera son constantes del script (no se configuran por
// variable de entorno). La conexion lee `DATABASE_URL` del `.env` de la raiz, con el mismo
// patron que los scripts de semilla.

const API_BASE_URL = 'https://api.trickingapi.dev';
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

// Validacion defensiva: si el timeout no fuera un entero positivo, `AbortSignal.timeout`
// recibiria un argumento invalido (por ejemplo NaN). Se cae al default.
function resolveTimeout(value) {
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_REQUEST_TIMEOUT_MS;
}

const REQUEST_TIMEOUT_MS = resolveTimeout(DEFAULT_REQUEST_TIMEOUT_MS);

// El driver se importa por ruta absoluta porque el script vive fuera del paquete @tricking/db
// y el bare import no se resuelve desde la raiz.
const NEON_ENTRY = new URL(
  '../packages/db/node_modules/@neondatabase/serverless/index.mjs',
  import.meta.url,
);

function loadEnvFile(path) {
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key !== '' && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function fetchJson(path) {
  const url = `${API_BASE_URL}${path}`;
  const response = await globalThis.fetch(url, {
    headers: { accept: 'application/json' },
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`La API respondio ${response.status} en ${url}`);
  }
  return response.json();
}

// /tricks devuelve un objeto indexado por id; /transitions y /landingstances, un arreglo.
function idsFromTricks(payload) {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => (item && typeof item.id === 'string' ? item.id : null))
      .filter((id) => id !== null);
  }
  if (payload !== null && typeof payload === 'object') {
    return Object.keys(payload);
  }
  throw new Error('La respuesta de /tricks no tiene el formato esperado.');
}

function idsFromArray(payload) {
  if (!Array.isArray(payload)) {
    throw new Error('La respuesta de la API no es un arreglo.');
  }
  return payload
    .map((item) => {
      if (item === null || typeof item !== 'object') {
        return null;
      }
      if (typeof item.id === 'string') {
        return item.id;
      }
      if (typeof item.slug === 'string') {
        return item.slug;
      }
      return null;
    })
    .filter((id) => id !== null);
}

// Los ids de transiciones y posturas de la API van en mayusculas y con guion bajo
// (por ejemplo REVERSE_POP); los slugs de la base van en minusculas y con guion medio
// (reverse-pop). Se comparan con esta forma canonica.
function canonical(id) {
  return id.toLowerCase().replace(/_/g, '-');
}

function difference(from, against) {
  const other = new Set(against);
  return [...new Set(from)].filter((id) => !other.has(id)).sort();
}

function report(label, liveIds, dbIds) {
  const missing = difference(liveIds, dbIds);
  const extra = difference(dbIds, liveIds);
  console.log(`${label}:`);
  console.log(`  API viva: ${new Set(liveIds).size}`);
  console.log(`  Base de datos: ${new Set(dbIds).size}`);
  console.log(`  Faltan en la base: ${missing.length}`);
  if (missing.length > 0) {
    for (const id of missing) {
      console.log(`    - ${id}`);
    }
  }
  console.log(`  En la base y no en la API: ${extra.length}`);
  if (extra.length > 0) {
    for (const id of extra) {
      console.log(`    - ${id}`);
    }
  }
  return missing;
}

async function main() {
  loadEnvFile(new URL('../.env', import.meta.url));

  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL. Definelo en el .env de la raiz o en el entorno.');
  }

  const { neon } = await import(NEON_ENTRY.href);
  const sql = neon(process.env.DATABASE_URL);

  const [liveTricks, liveTransitions, liveStances] = await Promise.all([
    fetchJson('/tricks'),
    fetchJson('/transitions'),
    fetchJson('/landingstances'),
  ]);

  const dbTrickRows = await sql.query('select id from tricks');
  const dbTransitionRows = await sql.query('select slug from transitions');
  const dbStanceRows = await sql.query('select slug from stances');

  // Los ids de transiciones y posturas de la API van en mayusculas; los slugs de la base,
  // en minusculas. Se comparan con la forma canonica (minusculas y guion medio).
  const missingTricks = report(
    'Trucos',
    idsFromTricks(liveTricks),
    dbTrickRows.map((row) => row.id),
  );
  const missingTransitions = report(
    'Transiciones',
    idsFromArray(liveTransitions).map(canonical),
    dbTransitionRows.map((row) => canonical(row.slug)),
  );
  const missingStances = report(
    'Posturas de aterrizaje',
    idsFromArray(liveStances).map(canonical),
    dbStanceRows.map((row) => canonical(row.slug)),
  );

  const totalMissing = missingTricks.length + missingTransitions.length + missingStances.length;
  console.log('');
  if (totalMissing === 0) {
    console.log('Auditoria: no falta contenido de TrickingAPI en la base.');
  } else {
    console.log(`Auditoria: falta contenido de TrickingAPI en la base (${totalMissing} en total).`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error en la auditoria de contenido: ${message}`);
  process.exitCode = 1;
});
