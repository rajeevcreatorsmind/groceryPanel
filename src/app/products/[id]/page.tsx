// app/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  CheckCircle,
  Layers,
  Loader2,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Link,
} from '@/components/icons';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '@/types/product';
import Image from 'next/image';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          setError('Product not found');
          return;
        }

        const data = productSnap.data() as Product;
        setProduct({ id: productSnap.id, ...data });
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Auto-rotate images (if multiple)
  useEffect(() => {
    if (!product?.imageUrls || product.imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % (product.imageUrls?.length || 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [product?.imageUrls]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (product?.imageUrls?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (product?.imageUrls?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-lg">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading product details...
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Product not found'}</p>
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              Back to Products
            </button>
          </div>
        </main>
      </div>
    );
  }

  const variants = product.packVariants || [];
  const variantCount = variants.length;
  const lowestPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/products/edit/${product.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
              >
                <Edit className="w-5 h-5" />
                Edit Product
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Image Carousel */}
            <div className="relative bg-gray-50 p-8">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <div className="relative max-w-2xl mx-auto">
                  <div className="overflow-hidden rounded-xl shadow-lg">
                    <Image
                      src={product.imageUrls[currentImageIndex]}
                      alt={product.name}
                      width={800}
                      height={600}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>

                  {product.imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.imageUrls.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-3 h-3 rounded-full ${
                              idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Package className="w-20 h-20 mb-4" />
                  <p>No images available</p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left - Basic Info */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {product.categoryName || 'Uncategorized'}
                      </span>
                      {product.brandName && (
                        <span className="px-4 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {product.brandName}
                        </span>
                      )}
                      {product.isStoryItem && (
                        <span className="px-4 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                          Story Item
                        </span>
                      )}
                      <span
                        className={`px-4 py-1 rounded-full text-sm font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {product.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Supplier</p>
                      <p className="font-medium">{product.supplier || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit</p>
                      <p className="font-medium">{product.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Right - Variants & Stats */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4">Pack Variants ({variantCount})</h3>

                    {variantCount > 0 ? (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Pack Size
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                MRP
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Stock
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {variants.map((variant, idx) => (
                              <tr key={idx}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {variant.packSize}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  ₹{variant.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {variant.mrp > variant.price ? `₹${variant.mrp.toFixed(2)}` : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {variant.stock}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {variant.stock === 0 ? (
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                      Out of Stock
                                    </span>
                                  ) : variant.stock < variant.minStockAlert ? (
                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                      In Stock
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No pack variants available</p>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Lowest Price</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {lowestPrice > 0 ? `₹${lowestPrice.toFixed(2)}` : '—'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600">Total Stock</p>
                      <p className="text-2xl font-bold">{totalStock} items</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offer Section */}
              {product.offerType && product.offerType !== 'None' && (
                <div className="mt-10 pt-8 border-t">
                  <h3 className="text-xl font-bold mb-4">Active Offer</h3>
                  <div className="bg-purple-50 p-6 rounded-xl">
                    <p className="font-medium text-lg mb-2">{product.offerType}</p>
                    {product.offerDetails && (
                      <div className="text-gray-700 space-y-1">
                        {product.offerDetails.buyQty && (
                          <p>Buy: {product.offerDetails.buyQty}</p>
                        )}
                        {product.offerDetails.getQty && (
                          <p>Get Free: {product.offerDetails.getQty}</p>
                        )}
                        {product.offerDetails.discountPercent && (
                          <p>Discount: {product.offerDetails.discountPercent}%</p>
                        )}
                        {product.offerDetails.buyProductId && (
                          <p>Buy Product ID: {product.offerDetails.buyProductId}</p>
                        )}
                        {product.offerDetails.getProductId && (
                          <p>Get Product ID: {product.offerDetails.getProductId}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}