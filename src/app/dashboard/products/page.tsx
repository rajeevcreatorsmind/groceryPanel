'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { mockProducts } from '@/types';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories
  const categories = ['all', 'Dairy', 'Grains', 'Vegetables', 'Fruits', 'Beverages', 'Snacks'];

  // Filter products
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your grocery inventory</p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Product
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-500 text-sm">Total Products</p>
          <p className="text-2xl font-bold">{mockProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-500 text-sm">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">
            {mockProducts.filter(p => p.currentStock < p.minStockAlert).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-500 text-sm">Active Products</p>
          <p className="text-2xl font-bold text-green-600">
            {mockProducts.filter(p => p.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold">6</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Product</th>
                <th className="text-left p-4 font-medium text-gray-700">SKU</th>
                <th className="text-left p-4 font-medium text-gray-700">Category</th>
                <th className="text-left p-4 font-medium text-gray-700">Price</th>
                <th className="text-left p-4 font-medium text-gray-700">Stock</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">
                          {product.category === 'Dairy' ? '🥛' :
                           product.category === 'Grains' ? '🍚' : '🥚'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.supplier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{product.sku}</code>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">₹{product.price}</div>
                    <div className="text-sm text-gray-500">Cost: ₹{product.costPrice}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{product.currentStock}</div>
                    <div className="text-sm text-gray-500">Min: {product.minStockAlert}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-sm w-fit ${
                        product.currentStock === 0 ? 'bg-red-100 text-red-800' :
                        product.currentStock < product.minStockAlert ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.currentStock === 0 ? 'Out of Stock' :
                         product.currentStock < product.minStockAlert ? 'Low Stock' : 'In Stock'}
                      </span>
                      {product.expiryDate && (
                        <span className="text-xs text-gray-500">
                          Expires: {product.expiryDate}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="View">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 rounded" title="Edit">
                        <Edit size={18} className="text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try changing your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {mockProducts.length} products
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Print List
          </button>
        </div>
      </div>
    </div>
  );
}