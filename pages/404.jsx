// pages/404.jsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-blue-500 mb-2">404</h1>
        <p className="text-gray-300 mb-6">That page went off-plan. Let’s get you back on track.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-800">Home</Link>
          <Link href="/app" className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500">Open App</Link>
        </div>
      </div>
    </div>
  );
}
