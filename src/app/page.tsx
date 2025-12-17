import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            🛒 Sure Wholesaler
          </h1>
          <p className="text-xl text-gray-600">
            Professional Grocery Management System
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">156</div>
            <div className="text-gray-600">Today's Orders</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">₹45,820</div>
            <div className="text-gray-600">Revenue</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">12</div>
            <div className="text-gray-600">Low Stock</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">23</div>
            <div className="text-gray-600">Active Delivery</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/login"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Login to Dashboard
          </Link>
          <button className="bg-white border text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            View Demo
          </button>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-bold mb-2">Inventory Management</h3>
              <p className="text-gray-600">Track stock, expiry dates, batches</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-bold mb-2">Delivery System</h3>
              <p className="text-gray-600">Real-time tracking & slot booking</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-gray-600">Sales reports & insights</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Built with Next.js 14 + TypeScript + Tailwind CSS + Firebase</p>
        </div>
      </div>
    </div>
  );
}