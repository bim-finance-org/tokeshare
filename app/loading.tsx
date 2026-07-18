export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-color1">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-color4"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
