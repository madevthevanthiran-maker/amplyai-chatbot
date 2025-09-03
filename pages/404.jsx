// pages/404.jsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-7xl font-bold text-blue-500 mb-2">404</div>
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-gray-400 mb-6">
          The page you’re looking for doesn’t exist. Want to open the app or go home?
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <button className="px-5 py-2 rounded-full border border-gray-700 hover:bg-gray-800">
              Home
            </button>
          </Link>
          <Link href="/app">
            <button className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500">
              Open AmplyAI
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
