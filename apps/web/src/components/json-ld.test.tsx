// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { breadcrumbJsonLd, JsonLd, trickJsonLd } from './json-ld';

afterEach(cleanup);

describe('JsonLd', () => {
  it('escapa el caracter < para que no se pueda cerrar el script', () => {
    const { container } = render(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const text = script?.innerHTML ?? '';
    expect(text).not.toContain('</script><script>');
    expect(text).toContain('\\u003c');
  });
});

describe('breadcrumbJsonLd', () => {
  it('genera un BreadcrumbList numerado con URLs absolutas', () => {
    const data = breadcrumbJsonLd([
      { name: 'Inicio', path: '/es' },
      { name: 'Trucos', path: '/es/tricks' },
      { name: 'Tornado', path: '/es/tricks/vertical-kicks/tornado' },
    ]);

    expect(data).toMatchObject({ '@context': 'https://schema.org', '@type': 'BreadcrumbList' });
    expect(data.itemListElement).toEqual([
      expect.objectContaining({ '@type': 'ListItem', position: 1, name: 'Inicio' }),
      expect.objectContaining({ position: 2, name: 'Trucos' }),
      expect.objectContaining({ position: 3, name: 'Tornado' }),
    ]);
    expect(JSON.stringify(data.itemListElement)).toContain('/es/tricks/vertical-kicks/tornado');
  });
});

describe('trickJsonLd', () => {
  it('arma un LearningResource en espanol con teaches cuando hay howTo', () => {
    const data = trickJsonLd({
      name: 'Aerial',
      description: 'English description',
      descriptionEs: 'Descripcion en espanol',
      howTo: 'English how to',
      howToEs: 'Como se hace en espanol',
      path: '/es/tricks/vertical-kicks/aerial',
      locale: 'es',
      siteName: 'Aprender Tricking',
    });

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: 'Aerial',
      description: 'Descripcion en espanol',
      teaches: 'Como se hace en espanol',
      inLanguage: 'es',
    });
    expect(data.isPartOf).toMatchObject({ '@type': 'WebSite', name: 'Aprender Tricking' });
    expect(JSON.stringify(data.url)).toContain('/es/tricks/vertical-kicks/aerial');
  });

  it('omite description y teaches cuando el truco no los tiene', () => {
    const data = trickJsonLd({
      name: 'Aerial',
      description: null,
      descriptionEs: null,
      howTo: null,
      howToEs: null,
      path: '/en/tricks/vertical-kicks/aerial',
      locale: 'en',
      siteName: 'Learn Tricking',
    });

    expect(data).not.toHaveProperty('description');
    expect(data).not.toHaveProperty('teaches');
    expect(data.inLanguage).toBe('en');
  });
});
