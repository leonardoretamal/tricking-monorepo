// Elige la descripcion segun el locale. El contenido de las fuentes (Loopkicks,
// TrickingAPI) viene en ingles y se traduce al espanol en `descriptionEs`; si todavia
// no hay traduccion se muestra el original. El ingles usa la fuente.
export function pickDescription(
  locale: string,
  description: string | null,
  descriptionEs: string | null,
): string | null {
  if (locale.startsWith('es')) {
    return descriptionEs ?? description;
  }
  return description;
}
