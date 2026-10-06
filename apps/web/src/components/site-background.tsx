// Capa de fondo global: malla de degradados con los colores del tema y un grano
// sutil encima. Es puramente decorativa, por eso va oculta para lectores de
// pantalla y no captura eventos. Sin estado ni efectos, es un componente de servidor.
export function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="tb-mesh pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="tb-grain absolute inset-0" />
    </div>
  );
}
