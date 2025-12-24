'use client';

import Sidebar from '@/components/Sidebar';
import { Images, Plus, Upload, Edit, Trash2, Eye, ArrowUpDown, Calendar } from '@/components/icons';
import { useState } from 'react';

export default function SlidersPage() {
  const [activeTab, setActiveTab] = useState('active');

  const sliders = [
    { id: 1, title: 'Summer Sale', image: '/api/placeholder/400/200', status: 'active', startDate: '2024-01-01', endDate: '2024-01-31', clicks: 1245 },
    { id: 2, title: 'Diwali Special', image: '/api/placeholder/400/200', status: 'active', startDate: '2024-10-20', endDate: '2024-11-15', clicks: 2890 },
    { id: 3, title: 'New Year Offer', image: '/api/placeholder/400/200', status: 'upcoming', startDate: '2024-12-20', endDate: '2025-01-10', clicks: 0 },
    { id: 4, title: 'Republic Day', image: '/api/placeholder/400/200', status: 'expired', startDate: '2024-01-20', endDate: '2024-01-30', clicks: 856 },
    { id: 5, title: 'Back to School', image: '/api/placeholder/400/200', status: 'active', startDate: '2024-06-01', endDate: '2024-06-30', clicks: 1678 },
    { id: 6, title: 'Monsoon Sale', image: '/api/placeholder/400/200', status: 'draft', startDate: '2024-07-01', endDate: '2024-07-31', clicks: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSliders = activeTab === 'all' 
    ? sliders 
    : sliders.filter(slider => slider.status === activeTab);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
       <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Images Sliders</h1>
            <p className="text-gray-600 mt-2">Manage homepage banner sliders and promotions</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium">
            <Plus className="w-5 h-5" />
            Add New Slider
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Sliders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
                <p className="text-green-600 text-sm mt-1">Displaying on site</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Images className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">6,669</p>
                <p className="text-blue-600 text-sm mt-1">+12.5% this month</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">1</p>
                <p className="text-blue-600 text-sm mt-1">Scheduled</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Best Performing</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">Diwali Special</p>
                <p className="text-green-600 text-sm mt-1">2,890 clicks</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <ArrowUpDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-2 mb-6">
            {['all', 'active', 'upcoming', 'expired', 'draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center mb-8 hover:border-purple-500 transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Slider Image</h3>
            <p className="text-gray-600 mb-4">Drag & drop or click to browse. Recommended: 1920x600px</p>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium">
              Browse Files
            </button>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSliders.map((slider) => (
              <div key={slider.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Images className="w-16 h-16 text-white/50" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(slider.status)}`}>
                      {slider.status.charAt(0).toUpperCase() + slider.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{slider.title}</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{slider.startDate} to {slider.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{slider.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}