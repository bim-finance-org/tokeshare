export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-color3">
      <div
        className="h-12 w-12 rounded-full border-4 border-color4 border-t-transparent animate-spin"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
