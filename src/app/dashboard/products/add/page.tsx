'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';

const categories = ['Dairy', 'Grains', 'Vegetables', 'Fruits', 'Beverages', 'Snacks', 'Spices'];
const units = ['pack', 'kg', 'gram', 'piece', 'liter'];
const suppliers = ['Amul', 'Fortune', 'Local Farm', 'Nestle', 'PepsiCo', 'ITC'];

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pack',
    price: '',
    costPrice: '',
    currentStock: '',
    minStockAlert: '10',
    expiryDate: '',
    supplier: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to Firebase
    alert('Product saved successfully!');
    router.push('/dashboard/products');
  };

  const generateSKU = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    const categoryCode = formData.category.slice(0, 3).toUpperCase() || 'PRO';
    const sku = `${categoryCode}-${randomNum.toString().padStart(3, '0')}`;
    setFormData({ ...formData, sku });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Add a new product to your inventory</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., Amul Milk 1L"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">SKU</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="e.g., MILK-001"
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="px-4 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Cost Price (₹)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Product description..."
                  />
                </div>
              </div>

              {/* Inventory Card */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Inventory Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Current Stock *</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Low Stock Alert *</label>
                    <input
                      type="number"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="10"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Supplier</label>
                    <select
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(sup => (
                        <option key={sup} value={sup}>{sup}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image & Actions */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Product Image</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto text-gray-400 mb-4" size={40} />
                  <p className="text-gray-600 mb-2">Drop image here or click to upload</p>
                  <p className="text-sm text-gray-500">Supports: JPG, PNG, WebP</p>
                  <input type="file" className="hidden" />
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Status</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span>Active Product</span>
                  </label>
                  <p className="text-sm text-gray-600">
                    Inactive products won't appear in the store
                  </p>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full border py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}