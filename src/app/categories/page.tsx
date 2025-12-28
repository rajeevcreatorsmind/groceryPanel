'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  Package,
  TrendingUp,
  AlertCircle,
} from '@/components/icons';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  subcategories?: string[];
  isBranded?: boolean;     // ← NEW
  brandName?: string;      // ← NEW
  createdAt?: any;
}

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(cats);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching categories:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.subcategories?.some(sub => sub.toLowerCase().includes(search.toLowerCase())) ||
    (cat.isBranded && cat.brandName?.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCategories = categories.filter(c => c.status === 'active').length;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products will lose this category assignment.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-10 ml-0 md:ml-64 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading categories...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">Manage product categories and subcategories</p>
          </div>
          <Link
            href="/categories/add"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-2xl font-bold mt-2">{categories.length}</p>
                <p className="text-green-600 text-sm mt-1">{activeCategories} active</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <FolderTree className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subcategories</p>
                <p className="text-2xl font-bold mt-2">
                  {categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Most Subcategories</p>
                <p className="text-2xl font-bold mt-2">
                  {categories.length > 0
                    ? categories.reduce((a, b) => (b.subcategories?.length || 0) > (a.subcategories?.length || 0) ? b : a).name
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Subcategories</p>
                <p className="text-2xl font-bold mt-2">
                  {categories.length > 0
                    ? Math.round(categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0) / categories.length)
                    : 0}
                </p>
                <p className="text-purple-600 text-sm mt-1">Per category</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <FolderTree className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories, subcategories, or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Category</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Subcategories</th>
                  {/* Brand column */}
<th className="text-left py-4 px-6 font-medium text-gray-700">Brand</th>

                  <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition">
                    {/* Category Name + Image */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-14 h-14 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                            <FolderTree className="w-8 h-8 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-lg text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">Main category</div>
                        </div>
                      </div>
                    </td>

                    {/* Subcategories */}
                    <td className="py-5 px-6">
                      {category.subcategories && category.subcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No subcategories</span>
                      )}
                    </td>

                    {/* Brand Name - NEW */}
                    <td className="py-5 px-6">
                      {category.isBranded && category.brandName ? (
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-medium">
                          {category.brandName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-5 px-6">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          category.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/categories/edit/${category.id}`}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle className="mx-auto w-20 h-20 text-gray-300 mb-6" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {categories.length === 0 ? 'No categories yet' : 'No categories found'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {categories.length === 0
                    ? 'Start by adding your first category to organize products.'
                    : 'Try adjusting your search or add a new category.'}
                </p>
                {categories.length === 0 && (
                  <Link
                    href="/categories/add"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Category
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}