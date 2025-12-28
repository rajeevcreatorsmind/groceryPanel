'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  AlertTriangle,
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
} from '@/components/icons';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';

export default function LowStockAlertPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all products and filter low stock
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));

      // Filter only low stock (currentStock > 0 but < minStockAlert)
      const lowStockProducts = productsData.filter(
        (p) => p.currentStock > 0 && p.currentStock < p.minStockAlert
      );

      setProducts(lowStockProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      setOpenDropdownId(null);
    }
  };

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-lg">Loading low stock alerts...</p>
        </main>
      </div>
    );
  }

  const lowStockCount = products.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Low Stock Alerts</h1>
              <p className="text-gray-600">
                Products that need restocking attention
              </p>
            </div>
          </div>

          {/* Summary Badge */}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 text-orange-800 rounded-xl text-lg font-semibold">
              <AlertTriangle className="w-6 h-6" />
              {lowStockCount} Product{lowStockCount !== 1 ? 's' : ''} Running Low
            </span>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" ref={tableRef}>
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-medium mb-2">All products are well stocked!</h3>
              <p className="text-gray-600">No items need restocking right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-orange-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Current Stock</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Alert Level</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-orange-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.imageUrls?.[0] ? (
                              <img
                                src={product.imageUrls[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl">
                                <Package className="w-8 h-8 text-orange-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.categoryName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="text-sm bg-gray-100 px-3 py-1 rounded-lg">{product.sku}</code>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xl font-bold text-red-600">
                          {product.currentStock} {product.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-600">
                          Below {product.minStockAlert} {product.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-xl">₹{product.price}</td>
                      <td className="py-4 px-6 text-center relative">
                        <button
                          onClick={(e) => toggleDropdown(e, product.id!)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {openDropdownId === product.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border z-50">
                            <Link
                              href={`/products/edit/${product.id}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition rounded-t-xl"
                              onClick={() => setOpenDropdownId(null)}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                              <span>Edit Product</span>
                            </Link>
                            <button
                              onClick={() => product.id && handleDelete(product.id)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 w-full text-left transition rounded-b-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Product</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}