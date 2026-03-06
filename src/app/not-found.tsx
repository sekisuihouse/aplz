import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 text-lg mb-8">App not found</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg bg-[#1B4F72] text-white font-semibold hover:bg-[#15415F] transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
