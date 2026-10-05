#!/usr/bin/env node
// Sincroniza .env desde .env.example de forma SEGURA: agrega SOLO las variables activas
// (sin comentar) que estan en .env.example y faltan en .env, con su valor de ejemplo
// (placeholder, nunca una credencial real). NUNCA modifica ni borra lineas existentes de
// .env, para no pisar los valores reales del usuario.
import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const EXAMPLE = resolve(ROOT, '.env.example');
const ENV = resolve(ROOT, '.env');

if (!existsSync(EXAMPLE)) {
  console.error('env:sync: falta .env.example en la raiz del repositorio');
  process.exit(1);
}

const example = readFileSync(EXAMPLE, 'utf8');

// Variables activas del ejemplo (no comentadas): KEY=valor.
const activeKeys = new Map();
for (const line of example.split('\n')) {
  const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
  if (match) {
    activeKeys.set(match[1], line);
  }
}

if (!existsSync(ENV)) {
  // No hay .env: se crea a partir del ejemplo (todo placeholder).
  writeFileSync(ENV, example, 'utf8');
  console.log(`env:sync: .env creado desde .env.example (${activeKeys.size} variables).`);
  process.exit(0);
}

const current = readFileSync(ENV, 'utf8');
// Se considera "presente" cualquier clave mencionada en .env, activa o comentada, para no
// duplicar.
const present = new Set();
for (const line of current.split('\n')) {
  const match = /^#?\s*([A-Z0-9_]+)=/.exec(line);
  if (match) {
    present.add(match[1]);
  }
}

const missing = [...activeKeys.entries()].filter(([key]) => !present.has(key));
if (missing.length === 0) {
  console.log('env:sync: .env ya tiene todas las variables activas de .env.example.');
  process.exit(0);
}

const block = [
  '',
  '# --- Sincronizado desde .env.example (agregar valores reales si aplica) ---',
  ...missing.map(([, line]) => line),
  '',
].join('\n');

appendFileSync(ENV, block, 'utf8');
console.log(`env:sync: agregadas ${missing.length} variable(s) a .env:`);
for (const [key] of missing) {
  console.log(`  - ${key}`);
}
