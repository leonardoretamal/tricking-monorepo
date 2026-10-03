export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center text-muted"
    >
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
