import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-color3">
      <h1 className="text-3xl md:text-4xl font-titleSemibold mb-4">Page not found</h1>
      <p className="text-color1/80 max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-color4 px-6 py-2 text-sm md:text-base hover:scale-105 transition-transform"
      >
        Back to home
      </Link>
    </div>
  );
}
