'use client';

import Sidebar from '@/components/Sidebar';
import { BarChart3, TrendingUp, Download, Filter, Calendar } from '@/components/icons';
import { useState } from 'react';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('monthly');

  const salesData = [
    { month: 'Jan', sales: 45000, orders: 120 },
    { month: 'Feb', sales: 52000, orders: 145 },
    { month: 'Mar', sales: 48000, orders: 132 },
    { month: 'Apr', sales: 61000, orders: 168 },
    { month: 'May', sales: 58000, orders: 155 },
    { month: 'Jun', sales: 72000, orders: 190 },
  ];

  const topProducts = [
    { name: 'Basmati Rice', sales: 125000, growth: '+15%' },
    { name: 'Fortune Oil', sales: 98000, growth: '+8%' },
    { name: 'Aashirvaad Atta', sales: 85000, growth: '+12%' },
    { name: 'Dairy Milk', sales: 75000, growth: '+5%' },
    { name: 'Fresh Vegetables', sales: 68000, growth: '+18%' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10 lg:p-12 ml-0 md:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Report</h1>
            <p className="text-gray-600 mt-2">Track and analyze your business performance</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹3,84,560</p>
                <p className="text-green-600 text-sm mt-1">+12.5% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">1,284</p>
                <p className="text-green-600 text-sm mt-1">+8.2% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹2,995</p>
                <p className="text-green-600 text-sm mt-1">+4.3% from last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customer Growth</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">+245</p>
                <p className="text-green-600 text-sm mt-1">+15.2% from last month</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sales Overview</h2>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg ${timeRange === range ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end gap-4">
            {salesData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-lg mb-2" style={{ height: `${data.sales / 1000}px` }} />
                <p className="text-sm text-gray-600">{data.month}</p>
                <p className="text-xs text-gray-500">₹{data.sales.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Grocery • Staples</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{product.sales.toLocaleString()}</p>
                    <p className={`text-sm ${product.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
            <div className="space-y-4">
              {['Staples', 'Beverages', 'Snacks', 'Dairy', 'Personal Care'].map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-bold text-gray-900">+{25 - index * 3}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                      style={{ width: `${80 - index * 15}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}