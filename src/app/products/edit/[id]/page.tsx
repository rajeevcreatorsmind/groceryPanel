'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, Link, Loader2, X } from '@/components/icons';
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // MULTIPLE IMAGES STATE
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [availableUnits] = useState(['pack', 'kg', 'gram', 'piece', 'liter', 'ml', 'dozen', 'bottle', 'box']);

  const [offerType, setOfferType] = useState<'None' | 'Buy One Get One Free' | 'Buy X Get Y Free' | 'Buy X Get Y Discount' | 'Buy X Product Get Y Product Free'>('None');
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
    unit: '',
    quantity: {
      value: '',
      unit: ''
    },
    mrp: '',
    price: '',
    discountPercent: '',
    discountedPrice: '',
    currentStock: '',
    minStockAlert: '10',
    expiryDate: '',
    supplier: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories, products, and current product
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;

      try {
        setCategoriesLoading(true);

        // Fetch categories
        const catsQuery = query(collection(db, 'categories'), where('status', '==', 'active'));
        const catsSnapshot = await getDocs(catsQuery);
        const cats = catsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);

        // Fetch products for offer selection
        const productsQuery = query(collection(db, 'products'), where('isActive', '==', true));
        const productsSnapshot = await getDocs(productsQuery);
        const prods = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(prods);

        // Fetch current product
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          alert('Product not found');
          router.push('/products');
          return;
        }

        const data = productSnap.data() as any;

        // Populate form data
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          categoryId: data.categoryId || '',
          categoryName: data.categoryName || '',
          unit: data.unit || '',
          quantity: data.quantity || { value: '', unit: '' },
          mrp: data.mrp?.toString() || '',
          price: data.price?.toString() || '',
          discountPercent: data.discountPercent?.toString() || '',
          discountedPrice: data.discountedPrice?.toString() || '',
          currentStock: data.currentStock?.toString() || '',
          minStockAlert: data.minStockAlert?.toString() || '10',
          expiryDate: data.expiryDate || '',
          supplier: data.supplier || '',
          description: data.description || '',
          isActive: data.isActive ?? true,
        });

        // Load existing images
        if (data.imageUrls && Array.isArray(data.imageUrls)) {
          setExistingImageUrls(data.imageUrls);
          setImagePreviews(data.imageUrls);
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

      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load product');
      } finally {
        setCategoriesLoading(false);
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
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = formData.categoryName.slice(0, 3).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${code}-${random}` }));
  };

  // Handle unit selection
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnit = e.target.value;
    if (selectedUnit === 'custom') {
      setShowCustomUnitInput(true);
      setFormData(prev => ({ ...prev, unit: '' }));
      return;
    }
    if (selectedUnit) {
      setShowCustomUnitInput(false);
      setFormData(prev => ({ ...prev, unit: selectedUnit }));
    }
  };

  const addCustomUnit = () => {
    const trimmedUnit = customUnitInput.trim();
    if (trimmedUnit) {
      setFormData(prev => ({ ...prev, unit: trimmedUnit }));
      setCustomUnitInput('');
      setShowCustomUnitInput(false);
    }
  };

  // Auto calculate discount
  useEffect(() => {
    const mrp = Number(formData.mrp) || 0;
    const sellingPrice = Number(formData.price) || 0;
    if (mrp > 0 && sellingPrice > 0) {
      if (sellingPrice < mrp) {
        const discountPercent = ((mrp - sellingPrice) / mrp) * 100;
        setFormData(prev => ({
          ...prev,
          discountPercent: discountPercent.toFixed(2),
          discountedPrice: sellingPrice.toFixed(2),
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          discountPercent: '',
          discountedPrice: sellingPrice.toFixed(2),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        discountPercent: '',
        discountedPrice: sellingPrice > 0 ? sellingPrice.toFixed(2) : '',
      }));
    }
  }, [formData.mrp, formData.price]);

  // IMAGE HANDLERS
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, WebP, GIF)');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
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

  const addUrlField = () => {
    setUrlInputs(prev => [...prev, '']);
  };

  const updateUrlInput = (index: number, value: string) => {
    const newUrls = [...urlInputs];
    newUrls[index] = value;
    setUrlInputs(newUrls);
    if (value.trim()) {
      try {
        new URL(value);
        setImagePreviews(prev => {
          const filtered = prev.filter(p => !urlInputs.includes(p));
          return [...filtered, value.trim()];
        });
      } catch {}
    }
  };

  const removeImage = (index: number) => {
    const removedPreview = imagePreviews[index];
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setExistingImageUrls(prev => prev.filter(url => url !== removedPreview));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    const urlIndex = urlInputs.findIndex(u => u === removedPreview);
    if (urlIndex !== -1) {
      setUrlInputs(prevUrls => prevUrls.filter((_, i) => i !== urlIndex));
    }
  };

  const removeUrl = (index: number) => {
    const removed = urlInputs[index];
    setUrlInputs(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter(p => p !== removed));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.categoryId) newErrors.category = 'Category is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.price) newErrors.price = 'Selling price is required';
    if (!formData.currentStock) newErrors.currentStock = 'Current stock is required';

    if (imagePreviews.length === 0) {
      newErrors.images = 'At least one product image is required';
    }

    if (formData.price && Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.mrp && Number(formData.mrp) <= 0) {
      newErrors.mrp = 'MRP must be greater than 0';
    }

    if (formData.mrp && formData.price) {
      const mrp = Number(formData.mrp);
      const price = Number(formData.price);
      if (price > mrp) {
        newErrors.price = 'Selling price cannot be higher than MRP';
        newErrors.mrp = 'MRP should be higher than selling price';
      }
    }

    if (formData.currentStock && Number(formData.currentStock) < 0) {
      newErrors.currentStock = 'Stock cannot be negative';
    }

    if (offerType !== 'None') {
      if (offerType === 'Buy X Get Y Free' || offerType === 'Buy X Get Y Discount') {
        if (!offerDetails.buyQty) newErrors.offerBuyQty = 'Buy quantity is required';
        if (!offerDetails.getQty && offerType === 'Buy X Get Y Free') {
          newErrors.offerGetQty = 'Get quantity is required';
        }
        if (!offerDetails.discountPercent && offerType === 'Buy X Get Y Discount') {
          newErrors.offerDiscount = 'Discount percentage is required';
        }
      }
      if (offerType === 'Buy X Product Get Y Product Free') {
        if (!offerDetails.buyProductId) newErrors.buyProduct = 'Buy product is required';
        if (!offerDetails.getProductId) newErrors.getProduct = 'Get product is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit - Update product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    const mrp = Number(formData.mrp) || 0;
    const price = Number(formData.price) || 0;
    if (mrp > 0 && price > mrp) {
      alert('Error: Selling price cannot be higher than MRP');
      return;
    }

    setLoading(true);
    try {
      // Upload new files
      const newUploadedUrls: string[] = [];
      for (const file of uploadedFiles) {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newUploadedUrls.push(url);
      }

      // Valid new URLs from input
      const validNewUrls = urlInputs
        .filter(u => u.trim())
        .filter(url => {
          try { new URL(url); return true; } catch { return false; }
        });

      // Final images: existing + new uploaded + new URLs
      const finalImageUrls = [
        ...existingImageUrls,
        ...newUploadedUrls,
        ...validNewUrls
      ].filter(Boolean);

      let preparedOfferDetails = null;
      if (offerType !== 'None') {
        preparedOfferDetails = {};
        if (offerType === 'Buy One Get One Free') {
          preparedOfferDetails = { buyQty: 1, getQty: 1 };
        } else if (offerType === 'Buy X Get Y Free') {
          preparedOfferDetails = {
            buyQty: Number(offerDetails.buyQty),
            getQty: Number(offerDetails.getQty)
          };
        } else if (offerType === 'Buy X Get Y Discount') {
          preparedOfferDetails = {
            buyQty: Number(offerDetails.buyQty),
            discountPercent: Number(offerDetails.discountPercent)
          };
        } else if (offerType === 'Buy X Product Get Y Product Free') {
          preparedOfferDetails = {
            buyProductId: offerDetails.buyProductId,
            getProductId: offerDetails.getProductId
          };
        }
      }

      const productData: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        unit: formData.unit,
        quantity: formData.quantity.value ? formData.quantity : null,
        mrp: Number(formData.mrp || formData.price) || 0,
        price: Number(formData.price),
        discountPercent: formData.discountPercent ? Number(formData.discountPercent) : 0,
        discountedPrice: Number(formData.discountedPrice || formData.price),
        currentStock: Number(formData.currentStock),
        minStockAlert: Number(formData.minStockAlert),
        expiryDate: formData.expiryDate || null,
        supplier: formData.supplier.trim() || null,
        description: formData.description.trim() || null,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
        isActive: formData.isActive,
        offerType: offerType !== 'None' ? offerType : null,
        offerDetails: preparedOfferDetails,
        updatedAt: serverTimestamp(),
      };

      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) delete productData[key];
      });

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
      <main className="flex-1 p-6 md:p-6 lg:p-4 ml-0 md:ml-6">
        <div className="max-w-auto mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => router.back()}
              className="p-3 hover:bg-gray-100 rounded-xl transition"
              type="button"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-2">Update product details</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-200">
            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Product Name */}
                <div className="lg:col-span-2">
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Amul Butter 500g"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Category *
                  </label>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-3 px-6 py-4 border rounded-xl bg-gray-50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading categories...</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.categoryId}
                      onChange={e => {
                        const selected = categories.find(c => c.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          categoryId: e.target.value,
                          categoryName: selected?.name || '',
                          sku: '' // Optional: clear SKU on category change
                        }));
                        if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className={`w-full px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">SKU</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.sku}
                      readOnly
                      placeholder="Auto-generated"
                      className="flex-1 px-6 py-4 border border-gray-300 rounded-xl bg-gray-50 text-lg"
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      disabled={!formData.categoryId}
                      className="px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 transition cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Unit *
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={handleUnitChange}
                    className={`w-full px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                      errors.unit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select unit</option>
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="custom">+ Add Custom Unit</option>
                    {formData.unit && !availableUnits.includes(formData.unit) && (
                      <option value={formData.unit}>{formData.unit} (custom)</option>
                    )}
                  </select>

                  {showCustomUnitInput && (
                    <div className="mt-4 p-4 border border-gray-300 rounded-xl bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Custom Unit
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={customUnitInput}
                          onChange={e => setCustomUnitInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomUnit())}
                          placeholder="e.g., packet, jar, bundle"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={addCustomUnit}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomUnitInput(false);
                            setCustomUnitInput('');
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {errors.unit && <p className="mt-2 text-sm text-red-600">{errors.unit}</p>}
                </div>

                {/* Quantity per Unit */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Quantity per Unit
                  </label>
                  {formData.unit ? (
                    <div className="space-y-3">
                      {/* Same conditional logic as Add page */}
                      {formData.unit === 'pack' && (
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { ...prev.quantity, value: e.target.value }
                            }))}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="e.g., 12"
                          />
                          <select
                            value={formData.quantity.unit}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { ...prev.quantity, unit: e.target.value }
                            }))}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          >
                            <option value="">Select type</option>
                            <option value="pieces">pieces</option>
                            <option value="grams">grams</option>
                            <option value="ml">ml</option>
                          </select>
                        </div>
                      )}
                      {(formData.unit === 'kg' || formData.unit === 'gram') && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { ...prev.quantity, value: e.target.value }
                            }))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder={formData.unit === 'kg' ? 'e.g., 1' : 'e.g., 500'}
                          />
                          <span className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[80px] text-center">
                            {formData.unit}
                          </span>
                        </div>
                      )}
                      {(formData.unit === 'liter' || formData.unit === 'ml') && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { ...prev.quantity, value: e.target.value }
                            }))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder={formData.unit === 'liter' ? 'e.g., 1' : 'e.g., 500'}
                          />
                          <span className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[80px] text-center">
                            {formData.unit}
                          </span>
                        </div>
                      )}
                      {formData.unit === 'dozen' && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { value: e.target.value, unit: "pieces" }
                            }))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="e.g., 12"
                          />
                          <span className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[120px] text-center">
                            pieces (1 dozen)
                          </span>
                        </div>
                      )}
                      {formData.unit === 'piece' && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { value: e.target.value, unit: "pieces" }
                            }))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="e.g., 1"
                          />
                          <span className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[80px] text-center">
                            pieces
                          </span>
                        </div>
                      )}
                      {['bottle', 'box'].includes(formData.unit) && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.quantity.value}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              quantity: { value: e.target.value, unit: formData.unit }
                            }))}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="e.g., 1"
                          />
                          <span className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[80px] text-center">
                            {formData.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                      Select unit first
                    </div>
                  )}
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    MRP (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.mrp}
                      onChange={e => {
                        const mrpValue = e.target.value;
                        setFormData(prev => ({ ...prev, mrp: mrpValue }));
                        if (errors.mrp) setErrors(prev => ({ ...prev, mrp: '' }));
                        if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                        const price = Number(formData.price) || 0;
                        const mrp = Number(mrpValue) || 0;
                        if (mrp > 0 && price > mrp) {
                          setErrors(prev => ({
                            ...prev,
                            price: 'Selling price cannot be higher than MRP',
                            mrp: 'MRP should be higher than selling price'
                          }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.price;
                            delete newErrors.mrp;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                        errors.mrp ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Maximum Retail Price"
                    />
                  </div>
                  {errors.mrp && <p className="mt-2 text-sm text-red-600">{errors.mrp}</p>}
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Final Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={e => {
                        const priceValue = e.target.value;
                        setFormData(prev => ({ ...prev, price: priceValue }));
                        if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                        if (errors.mrp) setErrors(prev => ({ ...prev, mrp: '' }));
                        const mrp = Number(formData.mrp) || 0;
                        const price = Number(priceValue) || 0;
                        if (mrp > 0 && price > mrp) {
                          setErrors(prev => ({
                            ...prev,
                            price: 'Selling price cannot be higher than MRP',
                            mrp: 'MRP should be higher than selling price'
                          }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.price;
                            delete newErrors.mrp;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Price customer will pay"
                    />
                  </div>
                  {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
                </div>

                {/* Discount % */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Discount % (Auto)
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      const mrp = Number(formData.mrp) || 0;
                      const price = Number(formData.price) || 0;
                      if (mrp > 0 && price > 0 && mrp > price) {
                        const discountPercent = ((mrp - price) / mrp) * 100;
                        return `${discountPercent.toFixed(2)}%`;
                      }
                      return '0%';
                    })()}
                    readOnly
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl bg-blue-50 text-lg font-semibold"
                  />
                </div>

                {/* Customer Price */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Customer Price (₹)
                  </label>
                  <div className={`w-full px-6 py-4 border border-gray-300 rounded-xl text-lg font-semibold ${
                    Number(formData.price) > Number(formData.mrp) && formData.mrp ? 'bg-red-50 text-red-600' : 'bg-green-50'
                  }`}>
                    ₹{(() => {
                      const price = Number(formData.price) || 0;
                      const mrp = Number(formData.mrp) || 0;
                      if (price > mrp && mrp > 0) {
                        return `${price.toFixed(2)} (Invalid: Price > MRP)`;
                      }
                      return price.toFixed(2);
                    })()}
                  </div>
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.currentStock}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, currentStock: e.target.value }));
                      if (errors.currentStock) setErrors(prev => ({ ...prev, currentStock: '' }));
                    }}
                    className={`w-full px-6 py-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg ${
                      errors.currentStock ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.currentStock && <p className="mt-2 text-sm text-red-600">{errors.currentStock}</p>}
                </div>

                {/* Low Stock Alert, Expiry, Supplier */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.minStockAlert}
                    onChange={e => setFormData(prev => ({ ...prev, minStockAlert: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. Amul, Local Vendor"
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                  />
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    placeholder="Product description, features, benefits..."
                  />
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

                {/* Product Images */}
                <div className="lg:col-span-3 border-t pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Images</h2>
                  <div className="flex gap-6 mb-6 border-b pb-4">
                    <button type="button" onClick={() => setImageSource('upload')} className={`font-semibold pb-2 border-b-4 transition ${imageSource === 'upload' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                      <Upload className="w-5 h-5 inline mr-2" /> Upload Files
                    </button>
                    <button type="button" onClick={() => setImageSource('url')} className={`font-semibold pb-2 border-b-4 transition ${imageSource === 'url' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                      <Link className="w-5 h-5 inline mr-2" /> Image URLs
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
                            <p className="text-sm text-gray-500 mt-3">Multiple images • JPG, PNG, WebP, GIF • Max 5MB each</p>
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
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                          />
                          {index === urlInputs.length - 1 && (
                            <button type="button" onClick={addUrlField} className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700">+ Add</button>
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
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-48 object-cover rounded-xl shadow-lg" />
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
                  {errors.images && <p className="mt-4 text-sm text-red-600">{errors.images}</p>}
                </div>

                {/* Actions */}
                <div className="lg:col-span-3 border-t pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-xl font-medium">Active Product</span>
                    </label>
                    <p className="text-gray-600 mt-2">Inactive products will not appear in the store</p>
                  </div>
                  <div className="flex gap-6">
                    <button
                      type="button"
                      onClick={() => router.push('/products')}
                      className="px-10 py-5 border-2 border-gray-300 rounded-xl font-bold text-lg hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-70 transition flex items-center gap-3 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Updating Product...
                        </>
                      ) : (
                        'Update Product'
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}