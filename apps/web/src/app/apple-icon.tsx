import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Icono de app para iOS y otros sistemas. Reproduce la marca del favicon: la letra T
// sobre el fondo oscuro del tema, con el magenta de la paleta nueva.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07080D',
        color: '#FF2E88',
        fontSize: 128,
        fontWeight: 700,
      }}
    >
      T
    </div>,
    { ...size },
  );
}
