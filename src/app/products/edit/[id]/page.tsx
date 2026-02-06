'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, Link as LinkIcon, Loader2, X, Plus } from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product, Category } from '@/types/product';

interface PackVariant {
  packSize: string;
  mrp: string;
  price: string;
  stock: string;
  minStockAlert: string;
  expiryDate: string;
  isActive: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Images
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');

  const [customUnitInput, setCustomUnitInput] = useState('');
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [availableUnits] = useState(['pack', 'kg', 'gram', 'piece', 'liter', 'ml', 'dozen', 'bottle', 'box']);

  const [offerType, setOfferType] = useState<
    'None' | 'Buy One Get One Free' | 'Buy X Get Y Free' | 'Buy X Get Y Discount' | 'Buy X Product Get Y Product Free'
  >('None');

  const [offerDetails, setOfferDetails] = useState({
    buyQty: '',
    getQty: '',
    discountPercent: '',
    buyProductId: '',
    getProductId: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    categoryName: '',
    brandId: '',           // NEW - for brand
    brandName: '',         // NEW - for brand
    unit: '',
    description: '',
    supplier: '',
    isActive: true,
    isStoryItem: false,
  });

  // Pack variants
  const [variants, setVariants] = useState<PackVariant[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;

      try {
        setCategoriesLoading(true);
        setBrandsLoading(true);

        // 1. Active Categories
        const catQ = query(collection(db, 'categories'), where('status', '==', 'active'));
        const catSnap = await getDocs(catQ);
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);

        // 2. Active Brands
        const brandQ = query(collection(db, 'brands'), where('isActive', '==', true));
        const brandSnap = await getDocs(brandQ);
        const brandList = brandSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name as string,
        }));
        setBrands(brandList);

        // 3. Active Products (for offers)
        const prodQ = query(collection(db, 'products'), where('isActive', '==', true));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

        // 4. Current Product
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          alert('Product not found');
          router.push('/products');
          return;
        }

        const data = productSnap.data() as any;

        // Set form data
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          categoryId: data.categoryId || '',
          categoryName: data.categoryName || '',
          brandId: data.brandId || '',           // Load existing brand
          brandName: data.brandName || '',
          unit: data.unit || '',
          description: data.description || '',
          supplier: data.supplier || '',
          isActive: data.isActive ?? true,
          isStoryItem: data.isStoryItem ?? false,
        });

        // Load images
        if (data.imageUrls && Array.isArray(data.imageUrls)) {
          setExistingImageUrls(data.imageUrls);
          setImagePreviews(data.imageUrls);
          setUrlInputs(data.imageUrls); // show in URL tab
        }

        // Load offer
        if (data.offerType) {
          setOfferType(data.offerType);
          if (data.offerDetails) {
            setOfferDetails({
              buyQty: data.offerDetails.buyQty?.toString() || '',
              getQty: data.offerDetails.getQty?.toString() || '',
              discountPercent: data.offerDetails.discountPercent?.toString() || '',
              buyProductId: data.offerDetails.buyProductId || '',
              getProductId: data.offerDetails.getProductId || '',
            });
          }
        }

        // Load pack variants (if exists)
        if (data.packVariants && Array.isArray(data.packVariants) && data.packVariants.length > 0) {
          setVariants(
            data.packVariants.map((v: any) => ({
              packSize: v.packSize?.toString() || '',
              mrp: v.mrp?.toString() || '',
              price: v.price?.toString() || '',
              stock: v.stock?.toString() || '',
              minStockAlert: v.minStockAlert?.toString() || '10',
              expiryDate: v.expiryDate || '',
              isActive: v.isActive ?? true,
            }))
          );
        } else {
          // Fallback if no variants (old product)
          setVariants([
            {
              packSize: '',
              mrp: data.mrp?.toString() || '',
              price: data.price?.toString() || '',
              stock: data.currentStock?.toString() || '',
              minStockAlert: data.minStockAlert?.toString() || '10',
              expiryDate: data.expiryDate || '',
              isActive: true,
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load product');
      } finally {
        setCategoriesLoading(false);
        setBrandsLoading(false);
      }
    };

    fetchData();
  }, [productId, router]);

  // Generate SKU
  const generateSKU = () => {
    if (!formData.categoryName) {
      alert('Please select a category first');
      return;
    }
    const code = formData.categoryName.slice(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, sku: `${code}-${random}` }));
  };

  // Variant handlers
  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      { packSize: '', mrp: '', price: '', stock: '', minStockAlert: '10', expiryDate: '', isActive: true },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      alert('At least one pack variant is required');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof PackVariant, value: string | boolean) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Image handlers (same as add page)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPEG, PNG, WebP, GIF allowed');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const addUrlField = () => setUrlInputs(prev => [...prev, '']);

  const updateUrlInput = (index: number, value: string) => {
    const newUrls = [...urlInputs];
    newUrls[index] = value;
    setUrlInputs(newUrls);

    if (value.trim()) {
      setImagePreviews(prev => {
        const filtered = prev.filter(p => !urlInputs.includes(p));
        return [...filtered, value.trim()];
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const removed = prev[index];
      const urlIndex = urlInputs.findIndex(u => u === removed);
      if (urlIndex !== -1) {
        setUrlInputs(prev => prev.filter((_, i) => i !== urlIndex));
      }
      return prev.filter((_, i) => i !== index);
    });
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeUrl = (index: number) => {
    const removed = urlInputs[index];
    setUrlInputs(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter(p => p !== removed));
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.categoryId) newErrors.category = 'Category is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';

    if (imagePreviews.length === 0 && existingImageUrls.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    variants.forEach((v, i) => {
      if (!v.packSize.trim() || Number(v.packSize) <= 0)
        newErrors[`variant_${i}_packSize`] = 'Valid pack size required';
      if (!v.price.trim() || Number(v.price) <= 0)
        newErrors[`variant_${i}_price`] = 'Valid selling price required';
      if (!v.stock.trim() || Number(v.stock) < 0)
        newErrors[`variant_${i}_stock`] = 'Valid stock quantity required';

      const mrpNum = Number(v.mrp) || 0;
      const priceNum = Number(v.price) || 0;
      if (mrpNum > 0 && priceNum > mrpNum) {
        newErrors[`variant_${i}_price`] = 'Price cannot be higher than MRP';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit - Update product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Upload new images
      const newUploadedUrls: string[] = [];
      for (const file of uploadedFiles) {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newUploadedUrls.push(url);
      }

      const validNewUrls = urlInputs.filter(u => u.trim()).filter(url => {
        try { new URL(url); return true; } catch { return false; }
      });

      const finalImageUrls = [...existingImageUrls, ...newUploadedUrls, ...validNewUrls].filter(Boolean);

      // Prepare variants
      const preparedVariants = variants.map(v => ({
        packSize: Number(v.packSize),
        mrp: Number(v.mrp) || Number(v.price),
        price: Number(v.price),
        stock: Number(v.stock),
        minStockAlert: Number(v.minStockAlert) || 10,
        expiryDate: v.expiryDate || null,
        isActive: v.isActive,
      }));

      // Prepare offer
      let preparedOfferDetails: any = null;
      if (offerType !== 'None') {
        if (offerType === 'Buy One Get One Free') {
          preparedOfferDetails = { buyQty: 1, getQty: 1 };
        } else if (offerType === 'Buy X Get Y Free') {
          if (offerDetails.buyQty && offerDetails.getQty) {
            preparedOfferDetails = {
              buyQty: Number(offerDetails.buyQty),
              getQty: Number(offerDetails.getQty),
            };
          }
        } else if (offerType === 'Buy X Get Y Discount') {
          if (offerDetails.buyQty && offerDetails.discountPercent) {
            preparedOfferDetails = {
              buyQty: Number(offerDetails.buyQty),
              discountPercent: Number(offerDetails.discountPercent),
            };
          }
        } else if (offerType === 'Buy X Product Get Y Product Free') {
          if (offerDetails.buyProductId && offerDetails.getProductId) {
            preparedOfferDetails = {
              buyProductId: offerDetails.buyProductId,
              getProductId: offerDetails.getProductId,
            };
          }
        }
      }

      const productData: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        brandId: formData.brandId || null,           // NEW
        brandName: formData.brandName || null,       // NEW
        unit: formData.unit,
        description: formData.description.trim() || null,
        supplier: formData.supplier.trim() || null,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
        isActive: formData.isActive,
        isStoryItem: formData.isStoryItem,
        offerType: offerType !== 'None' ? offerType : null,
        offerDetails: preparedOfferDetails,
        packVariants: preparedVariants,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'products', productId), productData);

      alert('Product updated successfully!');
      router.push('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => router.back()} className="p-3 hover:bg-gray-100 rounded-xl transition" type="button">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">Update product details</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit} className="p-8 lg:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Product Name */}
                <div className="lg:col-span-1">
                  <label className="block text-lg font-medium text-gray-700 mb-3">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-6 py-4 border rounded-xl text-lg ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-purple-500 outline-none`}
                    placeholder="e.g. Premium Chocolate Cake"
                    required
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Category *</label>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-3 px-6 py-4 border rounded-xl bg-gray-50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        const selected = categories.find(c => c.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          categoryId: e.target.value,
                          categoryName: selected?.name || '',
                          sku: '',
                        }));
                      }}
                      className={`w-full px-6 py-4 border rounded-xl text-lg ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-purple-500 outline-none`}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Brand</label>
                  {brandsLoading ? (
                    <div className="flex items-center gap-3 px-6 py-4 border rounded-xl bg-gray-50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading brands...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.brandId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedBrand = brands.find(b => b.id === selectedId);
                        setFormData(prev => ({
                          ...prev,
                          brandId: selectedId,
                          brandName: selectedBrand?.name || '',
                        }));
                      }}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    >
                      <option value="">Select brand (optional)</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">SKU</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.sku}
                      readOnly
                      className="flex-1 px-6 py-4 border border-gray-300 rounded-xl bg-gray-50 text-lg"
                      placeholder="Auto-generated"
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      disabled={!formData.categoryId}
                      className="px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setShowCustomUnitInput(true);
                        setFormData(prev => ({ ...prev, unit: '' }));
                      } else {
                        setShowCustomUnitInput(false);
                        setFormData(prev => ({ ...prev, unit: val }));
                      }
                    }}
                    className={`w-full px-6 py-4 border rounded-xl text-lg ${
                      errors.unit ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-purple-500 outline-none`}
                    required
                  >
                    <option value="">Select unit</option>
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="custom">+ Custom unit</option>
                  </select>

                  {showCustomUnitInput && (
                    <div className="mt-3 flex gap-3">
                      <input
                        type="text"
                        value={customUnitInput}
                        onChange={e => setCustomUnitInput(e.target.value)}
                        placeholder="e.g. packet"
                        className="flex-1 px-4 py-3 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUnitInput.trim()) {
                            setFormData(prev => ({ ...prev, unit: customUnitInput.trim() }));
                            setCustomUnitInput('');
                            setShowCustomUnitInput(false);
                          }
                        }}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {errors.unit && <p className="mt-2 text-sm text-red-600">{errors.unit}</p>}
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. Amul, Local Vendor"
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                  />
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <label className="block text-lg font-medium text-gray-700 mb-3">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    placeholder="Product details, ingredients, features..."
                  />
                </div>

                {/* isStoryItem & isActive */}
                <div className="lg:col-span-3 flex flex-wrap gap-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isStoryItem}
                      onChange={e => setFormData(prev => ({ ...prev, isStoryItem: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-lg font-medium">Mark as Story Item</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-lg font-medium">Active Product</span>
                  </label>
                </div>

                {/* Pack Variants */}
                <div className="lg:col-span-3 border-t pt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Pack Variants</h2>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                    >
                      <Plus className="w-5 h-5" />
                      Add Variant
                    </button>
                  </div>

                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50 relative"
                    >
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pack Size / Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={variant.packSize}
                            onChange={(e) => updateVariant(index, 'packSize', e.target.value)}
                            placeholder="e.g. 6, 12, 500"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                              errors[`variant_${index}_packSize`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`variant_${index}_packSize`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`variant_${index}_packSize`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.mrp}
                            onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                            placeholder="e.g. 999"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selling Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            placeholder="e.g. 699"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                              errors[`variant_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`variant_${index}_price`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`variant_${index}_price`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                            placeholder="e.g. 50"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                              errors[`variant_${index}_stock`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`variant_${index}_stock`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`variant_${index}_stock`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Low Stock Alert
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.minStockAlert}
                            onChange={(e) => updateVariant(index, 'minStockAlert', e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={variant.expiryDate}
                            onChange={(e) => updateVariant(index, 'expiryDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </div>

                        <div className="flex items-center pt-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                              className="w-5 h-5 text-purple-600 rounded"
                            />
                            <span className="text-sm font-medium">Active Variant</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {errors.variants && (
                    <p className="mt-4 text-red-600 text-center">{errors.variants}</p>
                  )}
                </div>

                {/* Images */}
                <div className="lg:col-span-3 border-t pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Images</h2>
                  <div className="flex gap-6 mb-6 border-b pb-4">
                    <button
                      type="button"
                      onClick={() => setImageSource('upload')}
                      className={`font-semibold pb-2 border-b-4 transition ${
                        imageSource === 'upload' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <Upload className="w-5 h-5 inline mr-2" /> Upload Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('url')}
                      className={`font-semibold pb-2 border-b-4 transition ${
                        imageSource === 'url' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5 inline mr-2" /> Image URLs
                    </button>
                  </div>

                  {imageSource === 'upload' && (
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-green-500 transition">
                        {imagePreviews.length > 0 ? (
                          <p className="text-sm text-gray-600">Click or drag to add more images</p>
                        ) : (
                          <>
                            <Upload className="mx-auto w-16 h-16 text-gray-400 mb-6" />
                            <p className="text-xl font-medium text-gray-700">Click to upload images</p>
                            <p className="text-sm text-gray-500 mt-3">Multiple images • JPG, PNG, WebP, GIF • Max 10MB each</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}

                  {imageSource === 'url' && (
                    <div>
                      {urlInputs.map((url, index) => (
                        <div key={index} className="flex gap-3 mb-4 items-center">
                          <input
                            type="url"
                            value={url}
                            onChange={e => updateUrlInput(index, e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          />
                          {index === urlInputs.length - 1 && (
                            <button type="button" onClick={addUrlField} className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                              + Add
                            </button>
                          )}
                          {urlInputs.length > 1 && (
                            <button type="button" onClick={() => removeUrl(index)} className="px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Image Previews ({imagePreviews.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-xl shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.images && (
                    <p className="mt-4 text-sm text-red-600">{errors.images}</p>
                  )}
                </div>

                {/* Special Offers */}
                <div className="lg:col-span-3 border-t pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Offers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">
                        Offer Type
                      </label>
                      <select
                        value={offerType}
                        onChange={e => {
                          const value = e.target.value as typeof offerType;
                          setOfferType(value);
                          setOfferDetails({ buyQty: '', getQty: '', discountPercent: '', buyProductId: '', getProductId: '' });
                          const newErrors = { ...errors };
                          delete newErrors.offerBuyQty;
                          delete newErrors.offerGetQty;
                          delete newErrors.offerDiscount;
                          delete newErrors.buyProduct;
                          delete newErrors.getProduct;
                          setErrors(newErrors);
                        }}
                        className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                      >
                        <option value="None">None</option>
                        <option value="Buy One Get One Free">Buy One Get One Free</option>
                        <option value="Buy X Get Y Free">Buy X Get Y Free</option>
                        <option value="Buy X Get Y Discount">Buy X Get Y Discount</option>
                        <option value="Buy X Product Get Y Product Free">Buy X Product Get Y Product Free</option>
                      </select>
                    </div>

                    {/* Same conditional offer fields as Add page */}
                    {offerType === 'Buy X Get Y Free' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Quantity *</label>
                          <input type="number" min="1" value={offerDetails.buyQty} onChange={e => setOfferDetails(prev => ({ ...prev, buyQty: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.offerBuyQty ? 'border-red-500' : 'border-gray-300'}`} />
                          {errors.offerBuyQty && <p className="mt-2 text-sm text-red-600">{errors.offerBuyQty}</p>}
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Get Quantity Free *</label>
                          <input type="number" min="1" value={offerDetails.getQty} onChange={e => setOfferDetails(prev => ({ ...prev, getQty: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.offerGetQty ? 'border-red-500' : 'border-gray-300'}`} />
                          {errors.offerGetQty && <p className="mt-2 text-sm text-red-600">{errors.offerGetQty}</p>}
                        </div>
                      </>
                    )}

                    {offerType === 'Buy X Get Y Discount' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Quantity *</label>
                          <input type="number" min="1" value={offerDetails.buyQty} onChange={e => setOfferDetails(prev => ({ ...prev, buyQty: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.offerBuyQty ? 'border-red-500' : 'border-gray-300'}`} />
                          {errors.offerBuyQty && <p className="mt-2 text-sm text-red-600">{errors.offerBuyQty}</p>}
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Discount % *</label>
                          <input type="number" min="1" max="100" value={offerDetails.discountPercent} onChange={e => setOfferDetails(prev => ({ ...prev, discountPercent: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.offerDiscount ? 'border-red-500' : 'border-gray-300'}`} />
                          {errors.offerDiscount && <p className="mt-2 text-sm text-red-600">{errors.offerDiscount}</p>}
                        </div>
                      </>
                    )}

                    {offerType === 'Buy X Product Get Y Product Free' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Product *</label>
                          <select value={offerDetails.buyProductId} onChange={e => setOfferDetails(prev => ({ ...prev, buyProductId: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.buyProduct ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Select product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>{product.name} (₹{product.price})</option>
                            ))}
                          </select>
                          {errors.buyProduct && <p className="mt-2 text-sm text-red-600">{errors.buyProduct}</p>}
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Get Product Free *</label>
                          <select value={offerDetails.getProductId} onChange={e => setOfferDetails(prev => ({ ...prev, getProductId: e.target.value }))} className={`w-full px-6 py-4 border rounded-xl ${errors.getProduct ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Select product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>{product.name} (₹{product.price})</option>
                            ))}
                          </select>
                          {errors.getProduct && <p className="mt-2 text-sm text-red-600">{errors.getProduct}</p>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="lg:col-span-3 border-t pt-10 flex justify-end gap-6">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-10 py-4 border border-gray-300 rounded-xl text-lg font-medium hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-4 cursor-pointer bg-purple-600 text-white rounded-xl text-lg font-bold hover:bg-purple-700 disabled:opacity-60 flex items-center gap-3 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Product'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}