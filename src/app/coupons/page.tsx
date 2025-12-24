'use client';

import Sidebar from '@/components/Sidebar';
import { Tag, Plus, Search, Filter, Copy, Edit, Trash2, Calendar, Users } from '@/components/icons';
import { useState } from 'react';

export default function CouponsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const coupons = [
    { code: 'WELCOME20', discount: '20%', type: 'Percentage', minOrder: 499, uses: 245, maxUses: 500, status: 'active', expiry: '2024-02-28' },
    { code: 'FLAT100', discount: '₹100', type: 'Fixed', minOrder: 999, uses: 189, maxUses: 300, status: 'active', expiry: '2024-01-31' },
    { code: 'DIWALI30', discount: '30%', type: 'Percentage', minOrder: 1499, uses: 312, maxUses: 500, status: 'active', expiry: '2024-01-25' },
    { code: 'NEWYEAR25', discount: '25%', type: 'Percentage', minOrder: 799, uses: 0, maxUses: 200, status: 'upcoming', expiry: '2024-12-25' },
    { code: 'SUMMER15', discount: '15%', type: 'Percentage', minOrder: 599, uses: 156, maxUses: 500, status: 'expired', expiry: '2023-12-31' },
    { code: 'FIRST50', discount: '₹50', type: 'Fixed', minOrder: 399, uses: 289, maxUses: 500, status: 'active', expiry: '2024-03-31' },
    { code: 'GROCERY10', discount: '10%', type: 'Percentage', minOrder: 299, uses: 423, maxUses: 1000, status: 'active', expiry: '2024-04-30' },
    { code: 'BULK200', discount: '₹200', type: 'Fixed', minOrder: 1999, uses: 89, maxUses: 100, status: 'active', expiry: '2024-02-15' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'all' || coupon.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
       <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-600 mt-2">Create and manage discount coupons</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium">
            <Plus className="w-5 h-5" />
            Create Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">6</p>
                <p className="text-green-600 text-sm mt-1">Currently running</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹1,24,560</p>
                <p className="text-blue-600 text-sm mt-1">Given to customers</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Coupon Usage</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">1,703</p>
                <p className="text-purple-600 text-sm mt-1">Total redemptions</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Most Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">GROCERY10</p>
                <p className="text-green-600 text-sm mt-1">423 times</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search coupons by code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
                <Filter className="w-5 h-5" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCoupons.map((coupon, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              {/* Coupon Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(coupon.status)}`}>
                    {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                  </div>
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-2xl font-bold mb-2">{coupon.code}</h3>
                <p className="text-white/80">Use code at checkout</p>
              </div>

              {/* Coupon Details */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Discount</p>
                    <p className="text-2xl font-bold text-gray-900">{coupon.discount} OFF</p>
                    <p className="text-sm text-gray-500">{coupon.type}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min. Order:</span>
                      <span className="font-medium text-gray-900">₹{coupon.minOrder}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uses:</span>
                      <span className="font-medium text-gray-900">{coupon.uses}/{coupon.maxUses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expiry:</span>
                      <span className="font-medium text-gray-900">{coupon.expiry}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Usage</span>
                      <span className="text-gray-900">{Math.round((coupon.uses / coupon.maxUses) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                        style={{ width: `${(coupon.uses / coupon.maxUses) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium">
                      Edit
                    </button>
                    <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}