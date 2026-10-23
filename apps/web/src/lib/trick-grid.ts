// Reglas puras de la grilla del catalogo de trucos. Viven fuera del componente para
// poder probarlas sin DOM y para que la grilla CSS siga siendo la ruta normal: con los
// tamanos de pagina actuales (hasta 100) no hace falta virtualizar.

// La virtualizacion queda solo como salvaguarda para conteos mucho mayores. Por debajo
// del umbral se usa la misma grilla CSS de siempre (1, 2 o 3 columnas).
export const VIRTUALIZE_THRESHOLD = 200;

export function shouldVirtualize(itemCount: number): boolean {
  return itemCount > VIRTUALIZE_THRESHOLD;
}

// Columnas de la grilla segun el ancho disponible del contenedor. Los cortes coinciden
// con los breakpoints de Tailwind usados por la grilla CSS (sm: 640, lg: 1024).
export function columnsForWidth(width: number): 1 | 2 | 3 {
  if (width >= 1024) {
    return 3;
  }
  if (width >= 640) {
    return 2;
  }
  return 1;
}
