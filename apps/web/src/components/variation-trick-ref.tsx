import { Link } from '@/i18n/navigation';
import type { TrickRef } from '@/lib/semantic-schemas';

// Enlace a un truco. Si el truco no tiene seccion, se muestra como texto plano
// porque no existe una ruta valida de detalle sin seccion.
export function VariationTrickRef({ trick }: { trick: TrickRef }) {
  if (trick.section === null) {
    return <span className="text-sm text-base-content/80">{trick.name}</span>;
  }

  return (
    <Link
      href={`/tricks/${trick.section}/${trick.id}`}
      className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {trick.name}
    </Link>
  );
}
