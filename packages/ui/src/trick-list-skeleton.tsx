export interface TrickListSkeletonProps {
  items?: number;
}

// Esqueleto del listado: refleja la estructura aproximada de las tarjetas mientras
// cargan los datos. No se usa para acciones puntuales (esas usan loading en el boton).
export function TrickListSkeleton({ items = 6 }: TrickListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="card border border-base-300 bg-base-100">
          <div className="card-body gap-3">
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
            <div className="flex gap-2">
              <div className="skeleton h-6 w-10" />
              <div className="skeleton h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
