'use client';

import React, { useState, useEffect } from 'react'; // ADD React import
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, ChevronDown, ChevronRight } from '@/components/icons';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  arrayRemove 
} from 'firebase/firestore';

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  productCount: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  level: number;
  parentId: string;
  parentName?: string;
}

export default function SubcategoriesPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [parentCategory, setParentCategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parent category
        const parentRef = doc(db, 'categories', id);
        const parentSnap = await getDoc(parentRef);
        
        if (!parentSnap.exists()) {
          alert('Parent category not found');
          router.push('/categories');
          return;
        }
        
        const parentData = parentSnap.data();
        setParentCategory({
          id: parentSnap.id,
          ...parentData
        });

        // Get subcategories from children array
        if (parentData.children && Array.isArray(parentData.children)) {
          setSubcategories(parentData.children.sort((a: Subcategory, b: Subcategory) => 
            (a.sortOrder || 0) - (b.sortOrder || 0)
          ));
        } else {
          setSubcategories([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load subcategories');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleDelete = async (subcategoryId: string, name: string) => {
    if (!confirm(`Delete subcategory "${name}"? This action cannot be undone.`)) return;
    
    try {
      const parentRef = doc(db, 'categories', id);
      const parentSnap = await getDoc(parentRef);
      
      if (parentSnap.exists()) {
        const data = parentSnap.data();
        const currentChildren = data.children || [];
        
        const subcategoryToDelete = currentChildren.find((child: Subcategory) => child.id === subcategoryId);
        if (subcategoryToDelete) {
          await updateDoc(parentRef, {
            children: arrayRemove(subcategoryToDelete),
            updatedAt: serverTimestamp()
          });

          // Update local state
          setSubcategories(prev => prev.filter(child => child.id !== subcategoryId));
          alert('Subcategory deleted successfully!');
        }
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Failed to delete subcategory');
    }
  };

  const toggleExpand = (subcategoryId: string) => {
    setExpandedSubId(expandedSubId === subcategoryId ? null : subcategoryId);
  };

  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    (sub.description && sub.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalProducts = subcategories.reduce((sum, sub) => sum + (sub.productCount || 0), 0);
  const activeSubcategories = subcategories.filter(sub => sub.status === 'active').length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/categories')}
            className="p-3 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Subcategories
                </h1>
                <p className="text-gray-600 mt-1">
                  Managing subcategories under "<span className="font-semibold text-purple-600">{parentCategory?.name}</span>"
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/categories/add?mode=create-child&parentId=${id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Subcategory
                </Link>
                <Link
                  href={`/categories/edit/${id}`}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  <Edit className="w-5 h-5" />
                  Edit Parent
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subcategories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{subcategories.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subcategories</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeSubcategories}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-blue-600 font-bold">#</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search subcategories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Subcategories Table */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          {filteredSubcategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {subcategories.length === 0 ? (
                <div>
                  <p className="text-lg mb-4">No subcategories yet</p>
                  <p className="text-gray-600 mb-6">Create subcategories to organize your products under "{parentCategory?.name}"</p>
                  <Link
                    href={`/categories/add?mode=create-child&parentId=${id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Subcategory
                  </Link>
                </div>
              ) : (
                'No matching subcategories found'
              )}
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-4 px-6 font-medium text-gray-700">Subcategory</th>
                    <th className="py-4 px-6 font-medium text-gray-700">Description</th>
                    <th className="py-4 px-6 font-medium text-gray-700">Products</th>
                    <th className="py-4 px-6 font-medium text-gray-700">Status</th>
                    <th className="py-4 px-6 font-medium text-gray-700">Sort</th>
                    <th className="py-4 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubcategories.map((subcategory) => {
                    const isExpanded = expandedSubId === subcategory.id;
                    
                    return (
                      <React.Fragment key={subcategory.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleExpand(subcategory.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div className="flex items-center gap-3">
                                {subcategory.imageUrl ? (
                                  <img
                                    src={subcategory.imageUrl}
                                    alt={subcategory.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="font-medium">{subcategory.name}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                            {subcategory.description || '—'}
                          </td>
                          
                          <td className="py-4 px-6 text-gray-600">
                            <span className="font-medium">{subcategory.productCount || 0}</span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                subcategory.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {subcategory.status}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6 text-gray-600">
                            <span className="font-medium">{subcategory.sortOrder || 0}</span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <div className="flex gap-3">
                              <Link
                                href={`/categories/edit/${id}?subId=${subcategory.id}`}
                                className="text-blue-600 hover:text-blue-800 p-2"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(subcategory.id, subcategory.name)}
                                className="text-red-600 hover:text-red-800 p-2"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">ID</h4>
                                  <p className="text-gray-900 font-mono text-sm">{subcategory.id}</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Created</h4>
                                  <p className="text-gray-900">
                                    {subcategory.createdAt ? 
                                      new Date(subcategory.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 
                                      '—'
                                    }
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Updated</h4>
                                  <p className="text-gray-900">
                                    {subcategory.updatedAt ? 
                                      new Date(subcategory.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 
                                      '—'
                                    }
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Parent Category</h4>
                                  <p className="text-gray-900">{subcategory.parentName || parentCategory?.name}</p>
                                </div>
                                
                                {subcategory.imageUrl && (
                                  <div className="md:col-span-2 lg:col-span-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Image Preview</h4>
                                    <img
                                      src={subcategory.imageUrl}
                                      alt={subcategory.name}
                                      className="max-h-40 rounded-lg object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Summary */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div>
                    Showing <span className="font-medium">{filteredSubcategories.length}</span> of{' '}
                    <span className="font-medium">{subcategories.length}</span> subcategories
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{totalProducts}</span> total products
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/categories')}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Categories
          </button>
        </div>
      </main>
    </div>
  );
}