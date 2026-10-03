// Utilidades de formato con Intl nativo. Sin date-fns. Ante entrada invalida
// (fecha invalida, locale desconocido o numero no finito) devuelven cadena vacia
// en lugar de lanzar.

function toValidDate(value: Date | number | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  date: Date | number | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const validDate = toValidDate(date);
  if (validDate === null) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat(locale, options).format(validDate);
  } catch {
    return '';
  }
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return '';
  }
}
