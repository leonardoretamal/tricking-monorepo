import { notFound } from 'next/navigation';

// Forzar el 404 durante la resolucion de metadata, antes de que empiece el
// streaming de la respuesta, para que la ruta desconocida devuelva HTTP 404
// (si no, se sirve la 404 con estado 200, un soft 404).
export function generateMetadata() {
  notFound();
}

export default function CatchAllPage() {
  notFound();
}
