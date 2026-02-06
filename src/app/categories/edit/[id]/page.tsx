'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, Link, Trash2 } from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CategoryData {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  status: 'active' | 'inactive';
  level: number;
  parentId?: string | null;
  parentName?: string | null;
  productCount: number;
  sortOrder: number;
  isStoryItem?: boolean;
  brandName?: string;
  isBranded?: boolean;
  children?: any[];
}

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const subId = searchParams.get('subId');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [parentCategory, setParentCategory] = useState<CategoryData | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [imageSource, setImageSource] = useState<'upload' | 'url' | 'existing'>('existing');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    sortOrder: 0,
    productCount: 0,
    level: 0,
    parentId: null as string | null,
    parentName: null as string | null,
    isStoryItem: false,
    brandName: '',
    isBranded: false,
  });

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'categories', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert('Category not found');
          router.push('/categories');
          return;
        }

        const data = docSnap.data() as CategoryData;
        setParentCategory({
          ...data,
          id: docSnap.id
        });

        // Check if editing a subcategory
        if (subId && data.children) {
          setIsSubcategory(true);
          const subcategory = data.children.find(child => child.id === subId);
          if (subcategory) {
            setFormData({
              name: subcategory.name || '',
              description: subcategory.description || '',
              status: subcategory.status || 'active',
              sortOrder: subcategory.sortOrder || 0,
              productCount: subcategory.productCount || 0,
              level: 1,
              parentId: id,
              parentName: data.name,
              isStoryItem: false,
              brandName: '',
              isBranded: false,
            });
            setExistingImageUrl(subcategory.imageUrl || '');
            setImagePreview(subcategory.imageUrl || '');
          } else {
            alert('Subcategory not found');
            router.push(`/categories/${id}/subcategories`);
            return;
          }
        } else {
          // Editing parent category
          setFormData({
            name: data.name || '',
            description: data.description || '',
            status: data.status || 'active',
            sortOrder: data.sortOrder || 0,
            productCount: data.productCount || 0,
            level: data.level || 0,
            parentId: data.parentId || null,
            parentName: data.parentName || null,
            isStoryItem: data.isStoryItem || false,
            brandName: data.brandName || '',
            isBranded: data.isBranded || false,
          });
          setExistingImageUrl(data.imageUrl || '');
          setImagePreview(data.imageUrl || '');
        }

        setFetching(false);
      } catch (error) {
        console.error('Error fetching category:', error);
        alert('Failed to load category');
        setFetching(false);
      }
    };

    fetchCategory();
  }, [id, subId, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrlInput('');
      setImageSource('upload');
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setImageUrlInput(url);
    if (url) {
      setImageFile(null);
      setImageSource('url');
      setImagePreview(url);
    } else {
      setImagePreview(existingImageUrl);
      setImageSource('existing');
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (imageSource === 'upload' && imageFile) {
      const storageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef);
    }
    if (imageSource === 'url' && imageUrlInput) {
      return imageUrlInput;
    }
    return existingImageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    setLoading(true);

    try {
      const finalImageUrl = await uploadImage();
      const now = new Date().toISOString();

      if (isSubcategory && subId && parentCategory) {
        // Update subcategory within parent's children array
        const categoryRef = doc(db, 'categories', id);
        const currentDoc = await getDoc(categoryRef);
        
        if (currentDoc.exists()) {
          const data = currentDoc.data();
          const currentChildren = data.children || [];
          
          const updatedChildren = currentChildren.map((child: any) =>
            child.id === subId 
              ? { 
                  ...child, 
                  name: formData.name.trim(),
                  description: formData.description?.trim() || '',
                  imageUrl: finalImageUrl,
                  status: formData.status,
                  sortOrder: formData.sortOrder,
                  productCount: formData.productCount,
                  updatedAt: now
                }
              : child
          );

          await updateDoc(categoryRef, {
            children: updatedChildren,
            updatedAt: serverTimestamp()
          });
          
          alert('Subcategory updated successfully!');
          router.push(`/categories/${id}/subcategories`);
        }
      } else {
        // Update parent category
        const categoryRef = doc(db, 'categories', id);
        const updateData: any = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          imageUrl: finalImageUrl,
          status: formData.status,
          sortOrder: formData.sortOrder,
          productCount: formData.productCount,
          updatedAt: serverTimestamp()
        };

        if (formData.isBranded) {
          updateData.brandName = formData.brandName?.trim() || '';
          updateData.isBranded = true;
        } else {
          updateData.brandName = '';
          updateData.isBranded = false;
        }

        if (!isSubcategory) {
          updateData.isStoryItem = formData.isStoryItem;
        }

        await updateDoc(categoryRef, updateData);
        alert('Category updated successfully!');
        router.push('/categories');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => isSubcategory ? router.push(`/categories/${id}/subcategories`) : router.push('/categories')}
              className="p-3 hover:bg-gray-100 rounded-xl transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isSubcategory ? 'Edit Subcategory' : 'Edit Category'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isSubcategory 
                  ? `Editing subcategory under "${parentCategory?.name}"`
                  : 'Update category details'
                }
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                {/* Left: Form Fields */}
                <div className="lg:col-span-2 space-y-12">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Details</h2>

                    <div className="space-y-8">
                      {/* Name */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          placeholder="Enter name"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          placeholder="Enter description"
                        />
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      {/* Product Count */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Product Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.productCount}
                          onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) || 0 })}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      {/* Brand Fields (only for parent categories) */}
                      {!isSubcategory && (
                        <>
                          <div className="space-y-4">
                            <label className="flex items-center gap-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.isBranded}
                                onChange={(e) => setFormData({ ...formData, isBranded: e.target.checked })}
                                className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-lg font-medium text-gray-700">
                                Is Branded?
                              </span>
                            </label>

                            {formData.isBranded && (
                              <div className="ml-10">
                                <label className="block text-lg font-medium text-gray-700 mb-3">
                                  Brand Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.brandName}
                                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                  placeholder="Enter brand name"
                                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                                />
                              </div>
                            )}
                          </div>

                          {/* Story Item */}
                          <div>
                            <label className="flex items-center gap-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.isStoryItem}
                                onChange={(e) => setFormData({ ...formData, isStoryItem: e.target.checked })}
                                className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-lg font-medium text-gray-700">
                                Show in Story Items
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      {/* Status */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-5">Status</label>
                        <div className="grid grid-cols-2 gap-6">
                          <label className="flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer hover:border-purple-500 transition has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50">
                            <input
                              type="radio"
                              name="status"
                              value="active"
                              checked={formData.status === 'active'}
                              onChange={() => setFormData({ ...formData, status: 'active' })}
                              className="w-6 h-6 text-purple-600"
                            />
                            <span className="text-lg font-medium">Active</span>
                          </label>
                          <label className="flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer hover:border-gray-400 transition has-[:checked]:border-gray-500">
                            <input
                              type="radio"
                              name="status"
                              value="inactive"
                              checked={formData.status === 'inactive'}
                              onChange={() => setFormData({ ...formData, status: 'inactive' })}
                              className="w-6 h-6 text-gray-600"
                            />
                            <span className="text-lg font-medium">Inactive</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Image + Actions */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">
                      Image <span className="text-red-500">*</span>
                    </h2>

                    <div className="flex gap-6 mb-8 border-b pb-4">
                      <button
                        type="button"
                        onClick={() => setImageSource('existing')}
                        className={`font-medium transition ${imageSource === 'existing' ? 'text-purple-600 border-b-3 border-purple-600' : 'text-gray-500'}`}
                      >
                        Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSource('upload')}
                        className={`font-medium transition ${imageSource === 'upload' ? 'text-purple-600 border-b-3 border-purple-600' : 'text-gray-500'}`}
                      >
                        <Upload className="w-5 h-5 inline mr-2" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSource('url')}
                        className={`font-medium transition ${imageSource === 'url' ? 'text-purple-600 border-b-3 border-purple-600' : 'text-gray-500'}`}
                      >
                        <Link className="w-5 h-5 inline mr-2" />
                        URL
                      </button>
                    </div>

                    {imageSource === 'existing' && existingImageUrl && (
                      <div className="relative">
                        <img
                          src={existingImageUrl}
                          alt="Current"
                          className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                        />
                      </div>
                    )}

                    {imageSource === 'upload' && (
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-purple-400 transition">
                          {imagePreview && imageSource === 'upload' ? (
                            <img src={imagePreview} alt="Preview" className="mx-auto max-h-80 rounded-xl object-cover shadow-md" />
                          ) : (
                            <>
                              <Upload className="mx-auto text-gray-400 mb-6 w-16 h-16" />
                              <p className="text-xl font-medium text-gray-700">Click to upload</p>
                              <p className="text-sm text-gray-500 mt-3">JPG, PNG, WebP</p>
                            </>
                          )}
                        </div>
                      </label>
                    )}

                    {imageSource === 'url' && (
                      <div>
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={handleUrlChange}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg mb-6"
                        />
                        {imagePreview && imageSource === 'url' && (
                          <img src={imagePreview} alt="Preview" className="mx-auto max-h-80 rounded-xl object-cover shadow-md" />
                        )}
                      </div>
                    )}

                    {imagePreview && (
                      <p className="text-center text-sm text-green-600 mt-6 font-medium">✓ Image ready</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-8 border-t border-gray-200">
                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading || !formData.name.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition"
                      >
                        {loading ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => isSubcategory ? router.push(`/categories/${id}/subcategories`) : router.push('/categories')}
                        className="w-full border-2 border-gray-300 py-5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition"
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
      </main>
    </div>
  );
}