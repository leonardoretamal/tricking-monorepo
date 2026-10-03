// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TrickCard } from './trick-card';

afterEach(cleanup);

describe('TrickCard', () => {
  it('renderiza el nombre y la descripcion', () => {
    render(<TrickCard name="B-Twist" description="Giro con patada" />);

    expect(screen.getByText('B-Twist')).toBeTruthy();
    expect(screen.getByText('Giro con patada')).toBeTruthy();
  });

  it('muestra el badge de dificultad cuando se pasa', () => {
    render(<TrickCard name="B-Twist" difficulty={3} />);

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('envuelve el titulo en un enlace cuando hay href', () => {
    render(<TrickCard name="B-Twist" href="/trucos/b-twist" />);

    const link = screen.getByRole('link', { name: 'B-Twist' });
    expect(link.getAttribute('href')).toBe('/trucos/b-twist');
  });
});
