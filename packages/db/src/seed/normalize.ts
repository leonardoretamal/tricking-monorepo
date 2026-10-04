// Normalizacion compartida por los scripts de semilla para emparejar textos de
// Loopkicks y TrickingAPI con los trucos del catalogo (los prereqs de la semilla usan
// nombres, no ids).
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Busca dentro de un texto de ejemplo el truco cuyo nombre normalizado aparece como
// subcadena. Se prueban primero los nombres mas largos para evitar coincidencias
// parciales (por ejemplo "Full" antes que "Full Hyper").
export function findTrickInText(
  text: string,
  tricksByName: Map<string, string>,
  namesByLength: string[],
): string | null {
  const normalized = normalizeKey(text);
  for (const name of namesByLength) {
    if (normalized.includes(name)) {
      const id = tricksByName.get(name);
      if (id !== undefined) {
        return id;
      }
    }
  }
  return null;
}
