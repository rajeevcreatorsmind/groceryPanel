'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Upload, X, Link, Loader2 } from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [imageSource, setImageSource] = useState<'existing' | 'upload' | 'url'>('existing');

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [currentSubcat, setCurrentSubcat] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Fetch existing category data
  useEffect(() => {
    const fetchCategory = async () => {
      if (!id) return;
      setFetching(true);
      try {
        const docRef = doc(db, 'categories', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || '',
            status: data.status || 'active',
          });
          setSubcategories(data.subcategories || []);
          setExistingImageUrl(data.imageUrl || '');
          setImagePreview(data.imageUrl || '');
        } else {
          alert('Category not found');
          router.push('/categories');
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        alert('Failed to load category');
      } finally {
        setFetching(false);
      }
    };

    fetchCategory();
  }, [id, router]);

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
    const url = e.target.value;
    setImageUrlInput(url);
    if (url.trim()) {
      setImageFile(null);
      setImageSource('url');
      setImagePreview(url.trim());
    } else {
      setImagePreview(existingImageUrl || '');
      setImageSource('existing');
    }
  };

  const addSubcategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentSubcat.trim()) {
      e.preventDefault();
      const trimmed = currentSubcat.trim();
      if (!subcategories.includes(trimmed)) {
        setSubcategories([...subcategories, trimmed]);
      }
      setCurrentSubcat('');
    }
  };

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }
    if (!imagePreview) {
      alert('Please provide a category image');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = existingImageUrl;

      if (imageSource === 'upload' && imageFile) {
        const storageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } else if (imageSource === 'url' && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      }
      // 'existing' → keep original

      await updateDoc(doc(db, 'categories', id as string), {
        name: formData.name.trim(),
        status: formData.status,
        imageUrl: finalImageUrl,
        subcategories,
        updatedAt: serverTimestamp(),
      });

      alert('Category updated successfully!');
      router.push('/categories');
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
        <main className="flex-1 flex items-center justify-center ml-0 md:ml-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Loading category...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-3 hover:bg-gray-100 rounded-xl transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
              <p className="text-gray-600 mt-1">Update category details</p>
            </div>
          </div>

          {/* Unified Main Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                {/* Left: Form Fields */}
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
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      {/* Subcategories */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">
                          Subcategories (Optional)
                        </label>
                        <p className="text-sm text-gray-500 mb-4">Press Enter after each subcategory</p>
                        <input
                          type="text"
                          value={currentSubcat}
                          onChange={(e) => setCurrentSubcat(e.target.value)}
                          onKeyDown={addSubcategory}
                          placeholder="Type and press Enter..."
                          className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />

                        {subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-6">
                            {subcategories.map((sub, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium"
                              >
                                {sub}
                                <button
                                  type="button"
                                  onClick={() => removeSubcategory(index)}
                                  className="hover:bg-purple-200 rounded-full p-1 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

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
                  {/* Image Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Category Image <span className="text-red-500">*</span></h2>

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
                        Upload New
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
                      <img
                        src={existingImageUrl}
                        alt="Current"
                        className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                      />
                    )}

                    {imageSource === 'upload' && (
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-purple-400 transition">
                          {imagePreview && imageSource === 'upload' ? (
                            <img src={imagePreview} alt="New preview" className="mx-auto max-h-80 rounded-xl object-cover shadow-md" />
                          ) : (
                            <>
                              <Upload className="mx-auto text-gray-400 mb-6 w-16 h-16" />
                              <p className="text-xl font-medium text-gray-700">Click to upload new</p>
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
                          <img
                            src={imagePreview}
                            alt="URL preview"
                            className="mx-auto max-h-80 rounded-xl object-cover shadow-md"
                            onError={() => setImagePreview(existingImageUrl || '')}
                          />
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
                        disabled={loading || !imagePreview}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition"
                      >
                        {loading ? 'Updating...' : 'Update Category'}
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
      </main>
    </div>
  );
}