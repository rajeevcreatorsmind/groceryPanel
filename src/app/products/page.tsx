'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Plus, Search, Filter, Edit, Trash2, Package,AlertTriangle, CheckCircle, Layers} from '@/components/icons';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter products - FIXED TYPE ERROR
  const filteredProducts = products.filter(product => {
    const name = product.name || '';
    const sku = product.sku || '';
    const categoryName = product.categoryName || '';
    
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                         sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories - FIXED TYPE ERROR
  const categories = ['all', ...Array.from(
    new Set(products.map(p => p.categoryName || '').filter(Boolean))
  )];

  // Calculate stats
  const totalProducts = products.length;
  const lowStock = products.filter(p => p.currentStock < p.minStockAlert).length;
  const activeProducts = products.filter(p => p.isActive).length;
  const totalCategories = new Set(products.map(p => p.categoryName || '').filter(Boolean)).size;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p>Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your grocery inventory</p>
          </div>
          <Link
            href="/products/add"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </Link>
        </div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
  <div className="bg-white rounded-xl shadow p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">Total Products</p>
        <p className="text-2xl font-bold mt-1">{totalProducts}</p>
      </div>
      <div className="p-2 bg-blue-100 rounded-lg">
        <Package className="w-5 h-5 text-blue-600" />
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-xl shadow p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">Low Stock</p>
        <p className="text-2xl font-bold text-orange-600 mt-1">{lowStock}</p>
      </div>
      <div className="p-2 bg-orange-100 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-xl shadow p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">Active Products</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{activeProducts}</p>
      </div>
      <div className="p-2 bg-green-100 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>
    </div>
  </div>
  
  <div className="bg-white rounded-xl shadow p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">Categories</p>
        <p className="text-2xl font-bold mt-1">{totalCategories}</p>
      </div>
      <div className="p-2 bg-purple-100 rounded-lg">
        <Layers className="w-5 h-5 text-purple-600" />
      </div>
    </div>
  </div>
</div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            🥛
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.supplier || 'No supplier'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{product.sku}</code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold">₹{product.price}</div>
                      {product.mrp && product.mrp > product.price && (
                        <div className="text-sm text-gray-500 line-through">MRP: ₹{product.mrp}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>{product.currentStock} {product.unit}</div>
                      <div className="text-sm text-gray-500">Alert: {product.minStockAlert}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        product.currentStock === 0 ? 'bg-red-100 text-red-800' :
                        product.currentStock < product.minStockAlert ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.currentStock === 0 ? 'Out of Stock' :
                         product.currentStock < product.minStockAlert ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/products/edit/${product.id}`} className="p-2 hover:bg-blue-50 rounded">
                          <Edit className="w-5 h-5 text-blue-600" />
                        </Link>
                        <button 
                          onClick={() => product.id && handleDelete(product.id)} 
                          className="p-2 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-medium mb-1">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}