'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  Layers,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
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

const PRODUCTS_PER_PAGE = 10;

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in' | 'low'>('all');


  // Close dropdown when clicking outside
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter products
const filteredProducts = products.filter((product) => {
  const name = product.name?.toLowerCase() || '';
  const sku = product.sku?.toLowerCase() || '';
  const categoryName = product.categoryName || '';

  const matchesSearch =
    name.includes(search.toLowerCase()) ||
    sku.includes(search.toLowerCase());

  const matchesCategory =
    selectedCategory === 'all' || categoryName === selectedCategory;

  const isLowStock =
    product.currentStock > 0 &&
    product.currentStock < product.minStockAlert;

  const isInStock =
    product.currentStock >= product.minStockAlert;

  const matchesStatus =
    selectedStatus === 'all' ||
    (selectedStatus === 'low' && isLowStock) ||
    (selectedStatus === 'in' && isInStock);

  return matchesSearch && matchesCategory && matchesStatus;
});

  // Categories
  const categories = [
    'all',
    ...Array.from(new Set(products.map((p) => p.categoryName || '').filter(Boolean))),
  ];

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Stats
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.currentStock < p.minStockAlert).length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const totalCategories = new Set(products.map((p) => p.categoryName || '').filter(Boolean)).size;

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
          <p className="text-lg">Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your grocery inventory</p>
          </div>
          <Link
            href="/products/add"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-3xl font-bold mt-2">{totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{lowStock}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Active Products</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeProducts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-3xl font-bold mt-2">{totalCategories}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>


            <div className="flex items-center gap-3">
  {/* <Filter className="w-5 h-5 text-gray-500" /> */}
  <select
    value={selectedStatus}
    onChange={(e) => {
      setSelectedStatus(e.target.value as 'all' | 'in' | 'low');
      setCurrentPage(1);
    }}
    className="px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
  >
    <option value="all">All Status</option>
    <option value="in">In Stock</option>
    <option value="low">Low Stock</option>
  </select>
</div>

          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" ref={tableRef}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Stock</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => (
                  <ProductRow
  key={product.id}
  product={product}
  isDropdownOpen={openDropdownId === product.id}
  onToggleDropdown={(e) => toggleDropdown(e, product.id!)}
  onDelete={() => product.id && handleDelete(product.id)}
  onCloseDropdown={() => setOpenDropdownId(null)}
/>

                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-medium mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 py-8 border-t">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-6 py-3 bg-white border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <span className="text-lg font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-6 py-3 bg-white border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Product Row with Auto-Sliding Images + Working 3-Dot Menu
function ProductRow({
  product,
  isDropdownOpen,
  onToggleDropdown,
  onDelete,
  onCloseDropdown,
}: {
  product: Product;
  isDropdownOpen: boolean;
  onToggleDropdown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onCloseDropdown: () => void;
}) {

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageUrls = product.imageUrls || [];

  // Auto-slide every 3 seconds if multiple images
  useEffect(() => {
    if (imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imageUrls.length]);

  const currentImage = imageUrls.length > 0 ? imageUrls[currentImageIndex] : null;

  return (
    <tr className="hover:bg-gray-50 transition">
      {/* Product Image + Name */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-6">
            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                {imageUrls.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {imageUrls.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition ${
                          i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-3xl">
                📦
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-lg">{product.name}</div>
            <div className="text-sm text-gray-500">{product.supplier || 'No supplier'}</div>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="py-4 px-6">
        <code className="text-sm bg-gray-100 px-3 py-1 rounded-lg">{product.sku}</code>
      </td>

      {/* Category */}
      <td className="py-4 px-6">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {product.categoryName}
        </span>
      </td>

      {/* Price */}
      <td className="py-4 px-6">
        <div className="font-bold text-xl">₹{product.price}</div>
        {product.mrp && product.mrp > product.price && (
          <div className="text-sm text-gray-500 line-through">MRP: ₹{product.mrp}</div>
        )}
      </td>

      {/* Stock */}
      <td className="py-4 px-6">
        <div className="font-medium">{product.currentStock} {product.unit}</div>
        <div className="text-sm text-gray-500">Alert: {product.minStockAlert}</div>
      </td>

      {/* Status */}
      <td className="py-4 px-6">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            product.currentStock === 0
              ? 'bg-red-100 text-red-800'
              : product.currentStock < product.minStockAlert
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {product.currentStock === 0
            ? 'Out of Stock'
            : product.currentStock < product.minStockAlert
            ? 'Low Stock'
            : 'In Stock'}
        </span>
      </td>

      {/* Actions - 3 Dot Menu */}
      <td className="py-4 px-6 text-center relative">
        <button
          onClick={onToggleDropdown}
          className="p-2 hover:bg-gray-200 rounded-lg transition"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border z-50">
            <Link
              href={`/products/edit/${product.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition rounded-t-xl"
             onClick={onCloseDropdown}

            >
              <Edit className="w-4 h-4 text-blue-600" />
              <span>Edit Product</span>
            </Link>
            <button
              onClick={onDelete}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 w-full text-left transition rounded-b-xl"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Product</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}