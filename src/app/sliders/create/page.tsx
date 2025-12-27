'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { ArrowLeft, Upload, X, Link, ChevronDown } from '@/components/icons';

export default function CreateSliderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Categories from Firestore
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Selected categories (array of ids)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    status: 'draft' as 'active' | 'upcoming' | 'expired' | 'draft',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const q = query(collection(db, 'categories'));
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
        }));
        setCategories(cats);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Failed to load categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleUrlInput = (value: string) => {
    const trimmed = value.trim();
    setForm((prev) => ({ ...prev, imageUrl: trimmed }));
    setPreview(trimmed);
    setSelectedFile(null);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setDropdownOpen(false); // Close dropdown after selection
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return alert('Title is required');
    if (selectedCategories.length === 0) return alert('Please select at least one category');
    if (!selectedFile && !form.imageUrl) return alert('Please upload or provide an image URL');

    setLoading(true);
    setUploading(true);

    try {
      let finalImageUrl = form.imageUrl;

      if (selectedFile && !finalImageUrl) {
        const storageRef = ref(storage, `sliders/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      if (!finalImageUrl) return alert('Failed to get image URL');

      await addDoc(collection(db, 'sliders'), {
        title: trimmedTitle,
        imageUrl: finalImageUrl,
        category: selectedCategories, // Array of category IDs
        status: form.status,
        startDate: Timestamp.fromDate(new Date(form.startDate)),
        endDate: Timestamp.fromDate(new Date(form.endDate)),
        clicks: 0,
        createdAt: serverTimestamp(),
      });

      alert('Slider created successfully!');
      router.push('/sliders');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create slider');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Create New Slider</h1>
              <p className="text-gray-600">Add a new banner to your site sections</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 lg:p-10 space-y-8">
              {/* Banner Image Section */}
              <div className="space-y-2">
                <label className="block text-xl font-semibold">
                  Banner Image <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-8 border-b">
                  <button
                    type="button"
                    onClick={() => setImageSource('upload')}
                    className={`pb-3 font-medium border-b-4 transition cursor-pointer ${
                      imageSource === 'upload'
                        ? 'text-purple-600 border-purple-600'
                        : 'text-gray-500 border-transparent'
                    }`}
                  >
                    <Upload className="w-5 h-5 inline mr-2" /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource('url')}
                    className={`pb-3 font-medium border-b-4 transition cursor-pointer ${
                      imageSource === 'url'
                        ? 'text-purple-600 border-purple-600'
                        : 'text-gray-500 border-transparent'
                    }`}
                  >
                    <Link className="w-5 h-5 inline mr-2" /> URL
                  </button>
                </div>

                {/* Upload Area */}
                {imageSource === 'upload' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition">
                    {preview ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain shadow"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreview('');
                            setSelectedFile(null);
                            setForm((prev) => ({ ...prev, imageUrl: '' }));
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="font-medium mb-2">Click to upload</p>
                        <p className="text-sm text-gray-600">Recommended: 1920×600px • JPG, PNG, WebP</p>
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      id="upload-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-input"
                      className="cursor-pointer mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-md"
                    >
                      {uploading ? 'Preparing...' : 'Select Image'}
                    </label>
                  </div>
                )}

                {/* URL Input */}
                {imageSource === 'url' && (
                  <div className="space-y-4">
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    {preview && (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain shadow"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreview('');
                            setForm((prev) => ({ ...prev, imageUrl: '' }));
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                    placeholder="e.g. Summer Mega Sale!"
                  />
                </div>

                {/* Custom Multi-Select Category */}
                <div>
                  <label className="block text-base font-medium mb-2">
                    Categories <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* Selected Categories Pills */}
                    <div className="min-h-12 px-4 py-3 border border-gray-300 rounded-lg flex flex-wrap gap-2 items-center bg-white">
                      {selectedCategories.length === 0 ? (
                        <span className="text-gray-500">Select categories...</span>
                      ) : (
                        selectedCategories.map((catId) => {
                          const cat = categories.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                              {cat?.name || catId}
                              <button
                                type="button"
                                onClick={() => removeCategory(catId)}
                                className="hover:bg-purple-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })
                      )}

                      {/* Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="ml-auto flex items-center text-gray-600 hover:text-purple-600"
                      >
                        <ChevronDown className={`w-5 h-5 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Dropdown List */}
                    {dropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {categoriesLoading ? (
                          <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : categories.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">No categories found</div>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.id)}
                              className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition ${
                                selectedCategories.includes(cat.id)
                                  ? 'bg-purple-100 text-purple-800 font-medium'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{cat.name}</span>
                                {selectedCategories.includes(cat.id) && (
                                  <span className="text-purple-600">✓</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">Click to add/remove categories</p>
                </div>

                <div>
                  <label className="block text-base font-medium mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-base font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading || selectedCategories.length === 0}
                  className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600
                   text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}