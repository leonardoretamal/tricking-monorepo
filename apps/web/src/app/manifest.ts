import type { MetadataRoute } from 'next';

// Manifiesto PWA (Fase 20.5). El sitio tiene un solo idioma base (espanol), asi que el
// manifiesto no se localiza. El color de fondo y el color de tema salen del tema claro
// (base-100 y primary).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aprender Tricking',
    short_name: 'Aprender Tricking',
    description:
      'Catálogo de trucos de tricking con técnicas, tips de mirada, variaciones y transiciones.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#e85a0d',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
