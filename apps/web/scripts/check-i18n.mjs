import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(scriptDir, '..', 'messages');
const referenceLocale = 'es';

function listLocales(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listJsonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flatten(value[key], next, out);
    }
    return out;
  }

  out.set(prefix, value);
  return out;
}

function extractPlaceholders(text) {
  if (typeof text !== 'string') {
    return [];
  }

  const found = text.match(/\{([a-zA-Z0-9_]+)\}/g) ?? [];
  return [...new Set(found)].sort();
}

function main() {
  if (!existsSync(messagesDir)) {
    console.error(`No existe el directorio de mensajes: ${messagesDir}`);
    process.exit(1);
  }

  const locales = listLocales(messagesDir);
  if (!locales.includes(referenceLocale)) {
    console.error(`Falta el locale de referencia "${referenceLocale}" en ${messagesDir}`);
    process.exit(1);
  }

  const referenceDir = join(messagesDir, referenceLocale);
  const referenceFiles = listJsonFiles(referenceDir);
  const referenceData = new Map();
  for (const file of referenceFiles) {
    referenceData.set(file, flatten(readJson(join(referenceDir, file)), '', new Map()));
  }

  const comparedLocales = locales.filter((locale) => locale !== referenceLocale);
  const errors = [];

  for (const locale of comparedLocales) {
    const localeDir = join(messagesDir, locale);
    const localeFiles = listJsonFiles(localeDir);

    for (const file of referenceFiles) {
      if (!localeFiles.includes(file)) {
        errors.push(`[${locale}] Falta el archivo ${file}`);
      }
    }
    for (const file of localeFiles) {
      if (!referenceFiles.includes(file)) {
        errors.push(`[${locale}] Archivo sin contraparte en es: ${file}`);
      }
    }

    for (const file of referenceFiles) {
      if (!localeFiles.includes(file)) {
        continue;
      }

      const referenceFlat = referenceData.get(file);
      const localeFlat = flatten(readJson(join(localeDir, file)), '', new Map());

      for (const key of referenceFlat.keys()) {
        if (!localeFlat.has(key)) {
          errors.push(`[${locale}] ${file}: falta la clave "${key}"`);
        }
      }
      for (const key of localeFlat.keys()) {
        if (!referenceFlat.has(key)) {
          errors.push(`[${locale}] ${file}: clave sobrante "${key}"`);
        }
      }

      for (const [key, referenceValue] of referenceFlat) {
        if (!localeFlat.has(key)) {
          continue;
        }

        const localeValue = localeFlat.get(key);
        const referencePlaceholders = extractPlaceholders(referenceValue);
        const localePlaceholders = extractPlaceholders(localeValue);

        for (const placeholder of referencePlaceholders) {
          if (!localePlaceholders.includes(placeholder)) {
            errors.push(`[${locale}] ${file}: falta el placeholder "${placeholder}" en "${key}"`);
          }
        }
        for (const placeholder of localePlaceholders) {
          if (!referencePlaceholders.includes(placeholder)) {
            errors.push(`[${locale}] ${file}: placeholder sobrante "${placeholder}" en "${key}"`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`i18n: se encontraron ${errors.length} problema(s):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const totalFiles = referenceFiles.length;
  console.log(
    `i18n: ${comparedLocales.length} locale(s) comparados contra "${referenceLocale}", ${totalFiles} archivo(s) por locale, paridad de archivos, claves y placeholders correcta.`,
  );
}

main();
