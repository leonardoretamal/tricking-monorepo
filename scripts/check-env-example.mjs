#!/usr/bin/env node
// Verifica que toda variable de entorno nueva (process.env.X o import.meta.env.X)
// que aparezca en los cambios preparados este declarada en .env.example.
// Se ejecuta en el gancho pre-commit. No bloquea si no hay variables nuevas.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const ENV_EXAMPLE = resolve(ROOT, '.env.example');

// Variables del runtime que no son configuracion del proyecto y no van en .env.example.
const ALLOWLIST = new Set([
  'NODE_ENV',
  'NODE_OPTIONS',
  'CI',
  'TZ',
  'PORT',
  'HOST',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
]);

const CODE_EXT = /\.(m?[jt]sx?|cjs)$/;

function stagedFiles() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function addedLines(file) {
  const out = execFileSync('git', ['diff', '--cached', '-U0', '--', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));
}

function referencedVars(text) {
  const names = new Set();
  const patterns = [/process\.env\.([A-Z0-9_]+)/g, /import\.meta\.env\.([A-Z0-9_]+)/g];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      names.add(match[1]);
    }
  }
  return names;
}

function declaredVars(content) {
  const names = new Set();
  for (const match of content.matchAll(/[A-Z][A-Z0-9_]{2,}/g)) {
    names.add(match[0]);
  }
  return names;
}

function main() {
  if (!existsSync(ENV_EXAMPLE)) {
    console.error('env:check: falta .env.example en la raiz del repositorio');
    process.exit(1);
  }

  const declared = declaredVars(readFileSync(ENV_EXAMPLE, 'utf8'));
  const missing = new Set();

  for (const file of stagedFiles()) {
    if (!CODE_EXT.test(file)) continue;
    if (file.startsWith('scripts/') || file.startsWith('node_modules/')) continue;
    for (const name of referencedVars(addedLines(file).join('\n'))) {
      if (ALLOWLIST.has(name)) continue;
      if (!declared.has(name)) missing.add(name);
    }
  }

  if (missing.size > 0) {
    console.error('env:check: variables de entorno nuevas sin declarar en .env.example:');
    for (const name of [...missing].sort()) console.error(`  - ${name}`);
    console.error('Agrega cada una a .env.example con su comentario breve y un valor de ejemplo.');
    process.exit(1);
  }

  console.log('env:check: sin variables de entorno nuevas sin declarar');
}

main();
