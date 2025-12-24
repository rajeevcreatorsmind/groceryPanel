'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Calendar, Package, DollarSign, ShoppingCart, XCircle, Filter } from '@/components/icons'; // Adjust icons as needed

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Page Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            {/* My Items Sold */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Items Sold</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-xl">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* My Revenue */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₹0</p>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* My Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">My Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            {/* Paid Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-4 bg-teal-100 rounded-xl">
                <DollarSign className="w-8 h-8 text-teal-600" />
              </div>
            </div>

            {/* COD Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">COD Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            {/* Cancelled Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow">
              <div>
                <p className="text-gray-600 text-sm font-medium">Cancelled Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Date Range Filter */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter by Date Range"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Clothing</option>
                  <option>Food</option>
                  <option>Books</option>
                </select>

                {/* Clear Button */}
                <button
                  onClick={() => {
                    setDateRange('');
                    setSelectedCategory('All');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}