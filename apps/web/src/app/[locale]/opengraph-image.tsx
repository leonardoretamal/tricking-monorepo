import { ImageResponse } from 'next/og';

// Imagen de Open Graph y Twitter Cards generada en el servidor. Usa los colores del
// tema en modo oscuro (es un asset, no un componente con clases).
export const alt = 'Aprender Tricking, catálogo de trucos, variaciones y transiciones';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0B0F1A',
        padding: '80px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            width: 72,
            height: 72,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            backgroundColor: '#FF6B1A',
            color: '#0B0F1A',
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          A
        </div>
        <div style={{ display: 'flex', color: '#F1F5F9', fontSize: 40, fontWeight: 600 }}>
          Aprender Tricking
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', width: 160, height: 10, backgroundColor: '#22D3EE' }} />
        <div
          style={{
            display: 'flex',
            color: '#F1F5F9',
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Catálogo de trucos de tricking
        </div>
        <div style={{ display: 'flex', color: '#94A3B8', fontSize: 32 }}>
          Trucos, variaciones, transiciones y tips de mirada
        </div>
      </div>
    </div>,
    { ...size },
  );
}
