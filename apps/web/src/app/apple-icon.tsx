import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Icono de app para iOS y otros sistemas. Reproduce la marca del favicon: la letra T
// sobre el fondo oscuro del tema, con el naranja y el cian de la paleta.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F1A',
        color: '#FF6B1A',
        fontSize: 128,
        fontWeight: 700,
      }}
    >
      T
    </div>,
    { ...size },
  );
}
