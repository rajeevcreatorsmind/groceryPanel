'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, X, Link as LinkIcon, Plus, Loader2 } from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CategoryFormData {
  name: string;
  description?: string;
  imageUrl: string;
  status: 'active' | 'inactive';
  sortOrder?: number;
  productCount: number;
  isStoryItem: boolean;
}

export default function CategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const parentId = searchParams.get('parentId');
  const editId = searchParams.get('id');

  const isCreatingChild = !!parentId && mode === 'create-child';
  const isEditing = !!editId && mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');

  const [parentName, setParentName] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    imageUrl: '',
    status: 'active',
    sortOrder: 1,
    productCount: 0,
    isStoryItem: false,
  });

  // Load parent name or existing category data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isCreatingChild && parentId) {
          const parentRef = doc(db, 'categories', parentId);
          const parentSnap = await getDoc(parentRef);
          if (parentSnap.exists()) {
            setParentName(parentSnap.data()?.name || 'Parent');
          } else {
            alert('Parent category not found');
            router.back();
          }
        }

        if (isEditing && editId) {
          const catRef = doc(db, 'categories', editId);
          const catSnap = await getDoc(catRef);
          if (catSnap.exists()) {
            const data = catSnap.data() as any;
            setFormData({
              name: data.name || '',
              description: data.description || '',
              imageUrl: data.imageUrl || '',
              status: data.status || 'active',
              sortOrder: data.sortOrder || 1,
              productCount: data.productCount || 0,
              isStoryItem: data.isStoryItem || false,
            });
            setImagePreview(data.imageUrl || '');
            setImageUrlInput(data.imageUrl || '');
            setImageSource(data.imageUrl?.startsWith('http') ? 'url' : 'upload');
          } else {
            alert('Category not found');
            router.back();
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        alert('Failed to load data');
      }
    };

    loadData();
  }, [isCreatingChild, isEditing, parentId, editId, router]);

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
      setImagePreview('');
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
    return ''; // No image is allowed
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
      const now = serverTimestamp();

      if (isEditing && editId) {
        // Update existing category
        const catRef = doc(db, 'categories', editId);
        await updateDoc(catRef, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          imageUrl: finalImageUrl || null,
          status: formData.status,
          sortOrder: formData.sortOrder || 1,
          productCount: formData.productCount || 0,
          isStoryItem: formData.isStoryItem,
          updatedAt: now,
        });
        alert('Category updated successfully!');
      } else if (isCreatingChild && parentId) {
        // Add as child in parent's "children" array
        const childData = {
          id: doc(collection(db, 'categories')).id,
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          imageUrl: finalImageUrl || null,
          status: formData.status,
          sortOrder: formData.sortOrder || 1,
          productCount: formData.productCount || 0,
          isStoryItem: formData.isStoryItem,
          level: 1,
          parentId,
          parentName: parentName || '',
          createdAt: now,
          updatedAt: now,
          children: [],
        };

        const parentRef = doc(db, 'categories', parentId);
        await updateDoc(parentRef, {
          children: arrayUnion(childData),
          updatedAt: now,
        });

        alert('Subcategory added successfully!');
      } else {
        // Create new parent category
        await addDoc(collection(db, 'categories'), {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          imageUrl: finalImageUrl || null,
          status: formData.status,
          sortOrder: formData.sortOrder || 1,
          productCount: formData.productCount || 0,
          isStoryItem: formData.isStoryItem,
          level: 0,
          parentId: null,
          parentName: null,
          children: [],
          createdAt: now,
          updatedAt: now,
        });

        alert('Parent category added successfully!');
      }

      router.push('/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isEditing
    ? 'Edit Category'
    : isCreatingChild
    ? `Add Subcategory under ${parentName || 'Parent'}`
    : 'Add New Parent Category';

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-3 hover:bg-gray-100 rounded-xl transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            {isCreatingChild
              ? 'Create a new subcategory'
              : isEditing
              ? 'Update category details'
              : 'Create a top-level (parent) category'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Category Details</h2>

                <div className="space-y-8">
                  {/* Name */}
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Beverages, Food, Electronics"
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows={3}
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
                      onChange={(e) => setFormData({ ...formData, productCount: Number(e.target.value) || 0 })}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
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
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 1 })}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                    />
                  </div>

                  {/* Is Story Item */}
                  {!isCreatingChild && (
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
                      <p className="text-sm text-gray-500 ml-10">
                        If checked, this category will appear in story sections (only for parent categories)
                      </p>
                    </div>
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

                  {!isCreatingChild && !isEditing && (
                    <p className="text-sm text-gray-500 italic">
                      Note: Subcategories will be stored inside the "children" array of this parent category.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Image + Submit */}
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Category Image <span className="text-red-500">*</span>
                </h2>

                <div className="flex gap-6 mb-8 border-b pb-4">
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
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        setImageUrlInput(url);
                        setImagePreview(url);
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg mb-6"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                        onError={() => setImagePreview('')}
                      />
                    )}
                  </div>
                )}

                {imagePreview && (
                  <p className="text-center text-sm text-green-600 mt-6 font-medium">
                    ✓ Image ready
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-8 border-t border-gray-200">
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition flex items-center justify-center gap-3"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading
                      ? 'Saving...'
                      : isEditing
                      ? 'Update Category'
                      : isCreatingChild
                      ? 'Add Subcategory'
                      : 'Add Parent Category'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/categories')}
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
  );
}