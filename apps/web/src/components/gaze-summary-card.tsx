import type { LucideIcon } from 'lucide-react';
import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Tarjeta destacada de los bloques de la seccion de tips (Fase 16.7 a 16.9). La idea
// clave usa el cian de acento, la regla de oro el ambar de advertencia con icono de
// alerta y el resumen corto un estilo neutro con borde de acento.

interface GazeSummaryCardProps {
  kind: string;
  content: string;
}

interface SummaryStyle {
  container: string;
  heading: string;
  icon: LucideIcon;
}

function styleFor(kind: string): SummaryStyle {
  switch (kind) {
    case 'idea_clave':
      return {
        container: 'border-accent/40 bg-accent/10',
        heading: 'text-accent',
        icon: Lightbulb,
      };
    case 'regla_de_oro':
      return {
        container: 'border-warning/40 bg-warning/10',
        heading: 'text-warning',
        icon: TriangleAlert,
      };
    default:
      return {
        container: 'border-border border-l-4 border-l-accent bg-base-200',
        heading: 'text-base-content',
        icon: Info,
      };
  }
}

export function GazeSummaryCard({ kind, content }: GazeSummaryCardProps) {
  const t = useTranslations('tips');
  const { container, heading, icon: Icon } = styleFor(kind);

  return (
    <article className={`flex h-full flex-col gap-2 rounded-box border p-5 ${container}`}>
      <h2 className={`flex items-center gap-2 text-base font-semibold ${heading}`}>
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        {t(`summaries.${kind}`)}
      </h2>
      <p className="text-sm leading-relaxed text-base-content/80">{content}</p>
    </article>
  );
}
