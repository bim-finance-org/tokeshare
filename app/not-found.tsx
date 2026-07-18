import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-color1 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="font-titleBold text-5xl text-color2">404</p>
        <h1 className="mt-4 font-titleSemibold text-2xl text-color4">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-color4 px-6 py-2.5 font-titleSemibold text-white transition-colors hover:bg-color2"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
