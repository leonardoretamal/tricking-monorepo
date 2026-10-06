import './globals.css';

// Fallback global (sin locale resoluble). No hay proveedor de i18n aca, por eso los
// textos son fijos en espanol. El layout de [locale] cubre la 404 normal.
export default function GlobalNotFound() {
  return (
    <html lang="es" data-theme="tricking-dark">
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-5 px-4 py-20 text-center">
          <p className="tb-eyebrow">Aprender Tricking</p>
          <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">Página no encontrada</h1>
          <p className="max-w-md text-base text-base-content/70">
            La página que buscas no existe o cambió de lugar.
          </p>
          <a href="/es" className="btn btn-primary mt-2">
            Volver al inicio
          </a>
        </main>
      </body>
    </html>
  );
}
