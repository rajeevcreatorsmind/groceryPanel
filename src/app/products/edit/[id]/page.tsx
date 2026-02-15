'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, Link as LinkIcon, Loader2, X, Plus } from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Product, Category } from '@/types/product';

interface Brand {
  id: string;
  name: string;
}

interface PackVariant {
  id: string;
  packSize: number;
  mrp: number;
  price: number;
  stock: number;
  minStockAlert: number;
  expiryDate: string;
  isActive: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
    subCategoryName: '',
    brandId: '',
    brandName: '',
    unit: '',
    description: '',
    supplier: '',
    isActive: true,
    isStoryItem: false,
  });

  const [customUnitInput, setCustomUnitInput] = useState('');
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false);
  const [availableUnits] = useState(['pack', 'kg', 'gram', 'piece', 'liter', 'ml', 'dozen', 'bottle', 'box']);

  // Images
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // both existing + new
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');

  // Pack variants
  const [variants, setVariants] = useState<PackVariant[]>([]);

  // Offer
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ────────────────────────────────────────────────
  // 1. Fetch product + categories + brands
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;

    const fetchAllData = async () => {
      try {
        setPageLoading(true);
        setCategoriesLoading(true);
        setBrandsLoading(true);

        // Product
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          alert('Product not found');
          router.push('/products');
          return;
        }

        const prodData = productSnap.data() as any;

        // Pre-fill form
        setFormData({
          name: prodData.name || '',
          sku: prodData.sku || '',
          categoryId: prodData.categoryId || '',
          categoryName: prodData.categoryName || '',
          subCategoryId: prodData.subCategoryId || '',
          subCategoryName: prodData.subCategoryName || '',
          brandId: prodData.brandId || '',
          brandName: prodData.brandName || '',
          unit: prodData.unit || '',
          description: prodData.description || '',
          supplier: prodData.supplier || '',
          isActive: prodData.isActive ?? true,
          isStoryItem: prodData.isStoryItem ?? false,
        });

        setExistingImageUrls(prodData.imageUrls || []);
        setImagePreviews(prodData.imageUrls || []);

        // Variants
        setVariants(
          (prodData.packVariants || []).map((v: any) => ({
            id: v.id || crypto.randomUUID().slice(0, 20),
            packSize: v.packSize || 0,
            mrp: v.mrp || 0,
            price: v.price || 0,
            stock: v.stock || 0,
            minStockAlert: v.minStockAlert || 10,
            expiryDate: v.expiryDate || '',
            isActive: v.isActive ?? true,
          }))
        );

        // Offer
        setOfferType(prodData.offerType || 'None');
        if (prodData.offerDetails) {
          setOfferDetails({
            buyQty: prodData.offerDetails.buyQty?.toString() || '',
            getQty: prodData.offerDetails.getQty?.toString() || '',
            discountPercent: prodData.offerDetails.discountPercent?.toString() || '',
            buyProductId: prodData.offerDetails.buyProductId || '',
            getProductId: prodData.offerDetails.getProductId || '',
          });
        }

        // Categories
        const catQ = query(collection(db, 'categories'), where('status', '==', 'active'));
        const catSnap = await getDocs(catQ);
        const cats = catSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
        setCategories(cats);

        // Brands
        const brandQ = query(collection(db, 'brands'), where('isActive', '==', true));
        const brandSnap = await getDocs(brandQ);
        const brandList = brandSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }));
        setBrands(brandList);

        // Products (for cross-product offers)
        const prodQ = query(collection(db, 'products'), where('isActive', '==', true));
        const prodSnap = await getDocs(prodQ);
        const prods = prodSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Unnamed Product',
        })) as Product[];
        setProducts(prods);
      } catch (err) {
        console.error(err);
        alert('Failed to load product data');
      } finally {
        setPageLoading(false);
        setCategoriesLoading(false);
        setBrandsLoading(false);
      }
    };

    fetchAllData();
  }, [productId, router]);

  // ────────────────────────────────────────────────
  // Handlers (mostly same as add page)
  // ────────────────────────────────────────────────

  const generateSKU = () => {
    let prefix = '';
    if (formData.categoryName) prefix += formData.categoryName.slice(0, 3).toUpperCase();
    if (formData.brandName) prefix += '-' + formData.brandName.slice(0, 3).toUpperCase();
    if (!prefix) prefix = 'PROD';
    const random = Math.floor(10000 + Math.random() * 90000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID().slice(0, 20),
        packSize: 0,
        mrp: 0,
        price: 0,
        stock: 0,
        minStockAlert: 10,
        expiryDate: '',
        isActive: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      alert('At least one variant is required');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof PackVariant, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => {
      const valid = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);
      if (!valid) alert('Only JPG, PNG, WebP allowed');
      if (f.size > 5 * 1024 * 1024) alert('Max 5MB per image');
      return valid && f.size <= 5 * 1024 * 1024;
    });
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews((p) => [...p, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const addUrlField = () => setUrlInputs((prev) => [...prev, '']);

  const updateUrlInput = (index: number, value: string) => {
    const newUrls = [...urlInputs];
    newUrls[index] = value;
    setUrlInputs(newUrls);
    if (value.trim()) {
      setImagePreviews((prev) => [...prev.filter((p, i) => i >= existingImageUrls.length), value.trim()]);
    }
  };

  const removeImage = (index: number) => {
    // If it's an existing image
    if (index < existingImageUrls.length) {
      const urlToDelete = existingImageUrls[index];
      setImagesToDelete((prev) => [...prev, urlToDelete]);
      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      // New upload or new URL
      const newIndex = index - existingImageUrls.length;
      setUploadedFiles((prev) => prev.filter((_, i) => i !== newIndex));
      setUrlInputs((prev) => prev.filter((_, i) => i !== newIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Product name required';
    if (!formData.categoryId) errs.category = 'Parent category required';
    if (!formData.subCategoryId) errs.subcategory = 'Subcategory required';
    if (!formData.unit) errs.unit = 'Unit required';
    if (imagePreviews.length === 0) errs.images = 'At least 1 image required';

    variants.forEach((v, i) => {
      if (v.packSize <= 0) errs[`v${i}_size`] = 'Valid pack size required';
      if (v.price <= 0) errs[`v${i}_price`] = 'Valid selling price required';
      if (v.stock < 0) errs[`v${i}_stock`] = 'Valid stock required';
      if (v.mrp > 0 && v.price > v.mrp) errs[`v${i}_price`] = 'Price cannot exceed MRP';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !productId) return;

    setLoading(true);

    try {
      // 1. Upload new images
      const newImageUrls: string[] = [];
      for (const file of uploadedFiles) {
        const r = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        newImageUrls.push(await getDownloadURL(r));
      }

      // Add new URL inputs
      urlInputs.forEach((url) => {
        if (url.trim()) newImageUrls.push(url.trim());
      });

      // 2. Final image list = kept existing + newly uploaded/added URLs
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      // 3. Delete images marked for deletion
      for (const url of imagesToDelete) {
        try {
          const fileRef = ref(storage, url);
          await deleteObject(fileRef);
        } catch (err) {
          console.warn('Could not delete old image:', url, err);
        }
      }

      // 4. Prepare variants
      const finalVariants = variants.map((v) => ({
        id: v.id,
        packSize: Number(v.packSize),
        mrp: Number(v.mrp) || Number(v.price),
        price: Number(v.price),
        stock: Number(v.stock),
        minStockAlert: Number(v.minStockAlert) || 10,
        expiryDate: v.expiryDate || null,
        isActive: v.isActive,
      }));

      // 5. Prepare offer
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

      // 6. Update document
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        subCategoryId: formData.subCategoryId,
        subCategoryName: formData.subCategoryName,
        brandId: formData.brandId || null,
        brandName: formData.brandName || null,
        unit: formData.unit,
        description: formData.description.trim() || null,
        supplier: formData.supplier.trim() || null,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
        isActive: formData.isActive,
        isStoryItem: formData.isStoryItem,
        packVariants: finalVariants,
        offerType: offerType !== 'None' ? offerType : null,
        offerDetails: preparedOfferDetails,
        updatedAt: serverTimestamp(),
      });

      alert('Product updated successfully!');
      router.back(); 
    } catch (err) {
      console.error('Update product error:', err);
      alert('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-lg">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading product...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => router.back()} className="p-3 hover:bg-gray-100 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">Update product details, variants & offers</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Name */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    placeholder="e.g. Premium Basmati Rice"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-3 px-6 py-4 border rounded-xl bg-gray-50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.id === e.target.value);
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          categoryName: cat?.name || '',
                          subCategoryId: '',
                          subCategoryName: '',
                        });
                      }}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    >
                      <option value="">Select Parent Category</option>
                      {categories
                        .filter((c) => c.level === 0)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  {formData.categoryId ? (
                    <select
                      required
                      value={formData.subCategoryId}
                      onChange={(e) => {
                        const parent = categories.find((c) => c.id === formData.categoryId);
                        const sub = parent?.children?.find((s: any) => s.id === e.target.value);
                        setFormData({
                          ...formData,
                          subCategoryId: e.target.value,
                          subCategoryName: sub?.name || '',
                        });
                      }}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    >
                      <option value="">Select Subcategory</option>
                      {categories
                        .find((c) => c.id === formData.categoryId)
                        ?.children?.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="px-6 py-4 border rounded-xl bg-gray-100 text-gray-500">
                      Select parent category first
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">Brand</label>
                  {brandsLoading ? (
                    <div className="flex items-center gap-3 px-6 py-4 border rounded-xl bg-gray-50">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      value={formData.brandId}
                      onChange={(e) => {
                        const b = brands.find((br) => br.id === e.target.value);
                        setFormData({
                          ...formData,
                          brandId: e.target.value,
                          brandName: b?.name || '',
                        });
                      }}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
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
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-6 py-4 border bg-white rounded-xl text-lg"
                      placeholder="Enter SKU or generate"
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      disabled={!formData.categoryId}
                      className="px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-60"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setShowCustomUnitInput(true);
                        setFormData((p) => ({ ...p, unit: '' }));
                      } else {
                        setShowCustomUnitInput(false);
                        setFormData((p) => ({ ...p, unit: val }));
                      }
                    }}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                  >
                    <option value="">Select unit</option>
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="custom">Custom unit...</option>
                  </select>

                  {showCustomUnitInput && (
                    <div className="mt-3 flex gap-3">
                      <input
                        type="text"
                        value={customUnitInput}
                        onChange={(e) => setCustomUnitInput(e.target.value)}
                        placeholder="e.g. packet"
                        className="flex-1 px-4 py-3 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUnitInput.trim()) {
                            setFormData((p) => ({ ...p, unit: customUnitInput.trim() }));
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
                </div>

                {/* Supplier + Toggles */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData((p) => ({ ...p, supplier: e.target.value }))}
                      placeholder="e.g. Sharma Traders"
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    />
                  </div>

                  {/* Show in Story */}
                  <div className="border rounded-lg px-4 h-[56px] mt-10 flex items-center justify-between">
                    <span className="text-base font-medium text-gray-700">Show in Story</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isStoryItem}
                        onChange={(e) => setFormData((p) => ({ ...p, isStoryItem: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:h-6 after:w-6 after:bg-white after:border after:rounded-full after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Active Product */}
                  <div className="border rounded-lg px-4 h-[56px] mt-10 flex items-center justify-between">
                    <span className="text-base font-medium text-gray-700">Active Product</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:h-6 after:w-6 after:bg-white after:border after:rounded-full after:transition-all peer-checked:bg-green-600 peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <label className="block text-lg font-medium text-gray-700 mb-3">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    placeholder="Product details, features, ingredients..."
                  />
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

                  {variants.map((v, i) => (
                    <div key={v.id} className="border rounded-xl p-6 mb-6 bg-gray-50 relative">
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Pack Size *</label>
                          <input
                            type="number"
                            min="1"
                            value={v.packSize}
                            onChange={(e) => updateVariant(i, 'packSize', Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. 1, 5, 10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">MRP (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={v.mrp}
                            onChange={(e) => updateVariant(i, 'mrp', Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. 999"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Selling Price (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => updateVariant(i, 'price', Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. 799"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Stock *</label>
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. 100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Low Stock Alert</label>
                          <input
                            type="number"
                            min="0"
                            value={v.minStockAlert}
                            onChange={(e) => updateVariant(i, 'minStockAlert', Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. 10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Expiry Date</label>
                          <input
                            type="date"
                            value={v.expiryDate}
                            onChange={(e) => updateVariant(i, 'expiryDate', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={v.isActive}
                              onChange={(e) => updateVariant(i, 'isActive', e.target.checked)}
                              className="w-5 h-5 text-purple-600 rounded"
                            />
                            <span className="text-sm font-medium">Active</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Images */}
                <div className="lg:col-span-3 border-t pt-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Images</h2>

                  <div className="flex gap-6 mb-6 border-b pb-4">
                    <button
                      type="button"
                      onClick={() => setImageSource('upload')}
                      className={`pb-2 border-b-4 transition ${
                        imageSource === 'upload' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
                      }`}
                    >
                      <Upload className="w-5 h-5 inline mr-2" />
                      Upload New
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('url')}
                      className={`pb-2 border-b-4 transition ${
                        imageSource === 'url' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5 inline mr-2" />
                      Add URL
                    </button>
                  </div>

                  {imageSource === 'upload' && (
                    <label className="block cursor-pointer">
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400">
                        <Upload className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-xl font-medium text-gray-700">Click or drag images</p>
                        <p className="text-sm text-gray-500 mt-2">Multiple • JPG/PNG/WebP • Max 5MB each</p>
                      </div>
                    </label>
                  )}

                  {imageSource === 'url' && (
                    <div className="space-y-4">
                      {urlInputs.map((url, i) => (
                        <div key={i} className="flex gap-3">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateUrlInput(i, e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                          />
                          {urlInputs.length > 1 && (
                            <button type="button" onClick={() => removeImage(i + existingImageUrls.length)} className="p-4 text-red-600">
                              <X className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addUrlField}
                        className="px-6 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200"
                      >
                        + Add another URL
                      </button>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {imagePreviews.map((prev, i) => (
                        <div key={i} className="relative group">
                          <img src={prev} alt="" className="w-full h-32 object-cover rounded-xl shadow" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Special Offers */}
                <div className="lg:col-span-3 border-t pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Offers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-3">Offer Type</label>
                      <select
                        value={offerType}
                        onChange={(e) => {
                          const value = e.target.value as typeof offerType;
                          setOfferType(value);
                          setOfferDetails({ buyQty: '', getQty: '', discountPercent: '', buyProductId: '', getProductId: '' });
                        }}
                        className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                      >
                        <option value="None">None</option>
                        <option value="Buy One Get One Free">Buy One Get One Free</option>
                        <option value="Buy X Get Y Free">Buy X Get Y Free</option>
                        <option value="Buy X Get Y Discount">Buy X Get Y Discount</option>
                        <option value="Buy X Product Get Y Product Free">Buy X Product Get Y Product Free</option>
                      </select>
                    </div>

                    {offerType === 'Buy X Get Y Free' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            value={offerDetails.buyQty}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, buyQty: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                            placeholder="e.g., 2"
                          />
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Get Quantity Free *</label>
                          <input
                            type="number"
                            min="1"
                            value={offerDetails.getQty}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, getQty: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                            placeholder="e.g., 1"
                          />
                        </div>
                      </>
                    )}

                    {offerType === 'Buy X Get Y Discount' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            value={offerDetails.buyQty}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, buyQty: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                            placeholder="e.g., 3"
                          />
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Discount % *</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={offerDetails.discountPercent}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, discountPercent: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                            placeholder="e.g., 20"
                          />
                        </div>
                      </>
                    )}

                    {offerType === 'Buy X Product Get Y Product Free' && (
                      <>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Buy Product *</label>
                          <select
                            value={offerDetails.buyProductId}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, buyProductId: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Get Product Free *</label>
                          <select
                            value={offerDetails.getProductId}
                            onChange={(e) => setOfferDetails((prev) => ({ ...prev, getProductId: e.target.value }))}
                            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="lg:col-span-3 flex justify-end gap-6 pt-10 border-t">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-10 py-4 border border-gray-300 rounded-xl text-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-4 bg-purple-600 text-white rounded-xl text-lg font-bold hover:bg-purple-700 disabled:opacity-60 flex items-center gap-3 cursor-pointer"
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