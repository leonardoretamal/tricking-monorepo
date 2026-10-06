export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center text-muted"
    >
      <span
        aria-hidden="true"
        className="loading loading-spinner loading-lg text-primary tb-pulse-glow rounded-full"
      />
      {label ? <span className="tb-eyebrow text-muted">{label}</span> : null}
    </div>
  );
}
