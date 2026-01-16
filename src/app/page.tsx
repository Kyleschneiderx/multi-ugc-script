export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          HeyGen Bulk Video Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create multiple AI videos at once with ease
        </p>
        <div className="space-x-4">
          <a
            href="/signup"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started
          </a>
          <a
            href="/pricing"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-indigo-600"
          >
            View Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
