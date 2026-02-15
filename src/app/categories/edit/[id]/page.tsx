'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, Link as LinkIcon, Trash2 , Loader2} from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  arrayRemove,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CategoryData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  level: number;
  parentId?: string | null;
  parentName?: string | null;
  productCount: number;
  sortOrder: number;
  isStoryItem?: boolean;
  docId?: string;           // for parent categories
  children?: any[];
}

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const subId = searchParams.get('subId');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSubcategory, setIsSubcategory] = useState(!!subId);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [imageSource, setImageSource] = useState<'existing' | 'upload' | 'url'>('existing');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    sortOrder: 1,
    productCount: 0,
    isStoryItem: false,
  });

  const [parentCategory, setParentCategory] = useState<CategoryData | null>(null);

  // Fetch data
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
          id: docSnap.id,
        });

        if (subId && data.children) {
          const sub = data.children.find((c: any) => c.id === subId);
          if (sub) {
            setFormData({
              name: sub.name || '',
              description: sub.description || '',
              status: sub.status || 'active',
              sortOrder: sub.sortOrder || 1,
              productCount: sub.productCount || 0,
              isStoryItem: false, // subcategories don't have this
            });
            setExistingImageUrl(sub.imageUrl || '');
            setImagePreview(sub.imageUrl || '');
          } else {
            alert('Subcategory not found');
            router.push(`/categories/${id}/subcategories`);
            return;
          }
        } else {
          // Parent category
          setFormData({
            name: data.name || '',
            description: data.description || '',
            status: data.status || 'active',
            sortOrder: data.sortOrder || 1,
            productCount: data.productCount || 0,
            isStoryItem: data.isStoryItem || false,
          });
          setExistingImageUrl(data.imageUrl || '');
          setImagePreview(data.imageUrl || '');
        }

        setFetching(false);
      } catch (error) {
        console.error('Error fetching:', error);
        alert('Failed to load data');
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
    return existingImageUrl || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setLoading(true);

    try {
      const finalImageUrl = await uploadImage();
      const now = serverTimestamp();

      if (isSubcategory && subId && parentCategory) {
        // ─── Update subcategory inside children array ───
        const parentRef = doc(db, 'categories', id);
        const parentSnap = await getDoc(parentRef);

        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          const children = parentData?.children || [];

          const updatedChildren = children.map((child: any) =>
            child.id === subId
              ? {
                  ...child,
                  name: formData.name.trim(),
                  description: formData.description?.trim() || null,
                  imageUrl: finalImageUrl || null,
                  status: formData.status,
                  sortOrder: formData.sortOrder,
                  productCount: formData.productCount,
                  // NO createdAt/updatedAt here — keep structure clean
                }
              : child
          );

          await updateDoc(parentRef, {
            children: updatedChildren,
            updatedAt: now,
          });

          alert('Subcategory updated successfully!');
          router.push(`/categories/${id}/subcategories`);
        }
      } else {
        // ─── Update parent category ───
        const catRef = doc(db, 'categories', id);
        const updatePayload: any = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          imageUrl: finalImageUrl || null,
          status: formData.status,
          sortOrder: formData.sortOrder,
          productCount: formData.productCount,
          isStoryItem: formData.isStoryItem,
          updatedAt: now,
        };

        // Preserve docId if it exists
        if (parentCategory?.docId) {
          updatePayload.docId = parentCategory.docId;
        }

        await updateDoc(catRef, updatePayload);

        alert('Category updated successfully!');
        router.push('/categories');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update. Check console.');
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

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-full mx-auto">
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
                  ? `Under "${parentCategory?.name}"`
                  : 'Update parent category details'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                {/* Left: Fields */}
                <div className="lg:col-span-2 space-y-12">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Category Details</h2>

                    <div className="space-y-8">
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
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Description (optional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 1 })}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Product Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.productCount}
                          onChange={(e) => setFormData({ ...formData, productCount: Number(e.target.value) || 0 })}
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      {!isSubcategory && (
                        <div>
                          <label className="flex items-center gap-4 cursor-pointer mb-3">
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
                      )}

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
                          <label className="flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer hover:border-gray-400 transition">
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

                {/* Right: Image + Buttons */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">
                      Category Image
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
                        <LinkIcon className="w-5 h-5 inline mr-2" />
                        URL
                      </button>
                    </div>

                    {imageSource === 'existing' && existingImageUrl && (
                      <img
                        src={existingImageUrl}
                        alt="Current image"
                        className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                      />
                    )}

                    {imageSource === 'upload' && (
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-purple-400 transition">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                            />
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
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-gray-200">
                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading || !formData.name.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition flex items-center justify-center gap-3 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Updating...
                          </>
                        ) : 'Update Category'}
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