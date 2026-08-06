export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-transparent border-t-[#e5e7eb]"
      />
    </div>
  );
}
