'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter, useParams } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, isBefore, isWithinInterval } from 'date-fns';
import { ArrowLeft, Upload, X, Link, ChevronDown, Clock, Calendar } from '@/components/icons';

export default function EditSliderPage() {
  const router = useRouter();
  const params = useParams();
  const sliderId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingSlider, setLoadingSlider] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');

  // Categories from Firestore
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Selected categories (array of ids)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    publishType: 'draft' as 'draft' | 'scheduled',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  // Calculate current status for preview
  const calculateCurrentStatus = () => {
    if (form.publishType === 'draft') {
      return { status: 'draft', label: 'Draft', color: 'text-yellow-600' };
    }
    
    const now = new Date();
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    
    if (isBefore(now, startDate)) {
      return { status: 'upcoming', label: 'Upcoming', color: 'text-blue-600' };
    } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return { status: 'active', label: 'Active', color: 'text-green-600' };
    } else {
      return { status: 'expired', label: 'Expired', color: 'text-gray-600' };
    }
  };

  const currentStatus = calculateCurrentStatus();

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

  // Fetch slider data
  useEffect(() => {
    const fetchSlider = async () => {
      if (!sliderId) return;

      try {
        setLoadingSlider(true);
        const sliderRef = doc(db, 'sliders', sliderId);
        const sliderDoc = await getDoc(sliderRef);

        if (!sliderDoc.exists()) {
          alert('Slider not found');
          router.push('/sliders');
          return;
        }

        const data = sliderDoc.data();
        
        // Convert Firestore timestamps to Date objects
        const startDate = data.startDate?.toDate() || new Date();
        const endDate = data.endDate?.toDate() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        // Determine publish type based on stored data
        const publishType = data.publishType || (data.status === 'draft' ? 'draft' : 'scheduled');
        
        setForm({
          title: data.title || '',
          imageUrl: data.imageUrl || '',
          publishType: publishType as 'draft' | 'scheduled',
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        });

        // Set original image URL for comparison
        if (data.imageUrl) {
          setOriginalImageUrl(data.imageUrl);
          setPreview(data.imageUrl);
          setImageSource('url');
        }

        // Set selected categories
        if (Array.isArray(data.category)) {
          setSelectedCategories(data.category);
        } else if (data.category) {
          setSelectedCategories([data.category]);
        }

      } catch (error) {
        console.error('Error fetching slider:', error);
        alert('Failed to load slider');
        router.push('/sliders');
      } finally {
        setLoadingSlider(false);
      }
    };

    fetchSlider();
  }, [sliderId, router]);

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
    setDropdownOpen(false);
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return alert('Title is required');
    if (selectedCategories.length === 0) return alert('Please select at least one category');
    
    // Check if we have an image
    if (!originalImageUrl && !selectedFile && !form.imageUrl) {
      return alert('Please upload or provide an image URL');
    }

    // Date validation for scheduled sliders
    if (form.publishType === 'scheduled') {
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);
      
      if (endDate <= startDate) {
        return alert('End date must be after start date');
      }
    }

    setLoading(true);
    setUploading(true);

    try {
      let finalImageUrl = originalImageUrl;

      // If user uploaded a new file
      if (selectedFile) {
        const storageRef = ref(storage, `sliders/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } 
      // If user provided a new URL (and didn't upload a file)
      else if (form.imageUrl && form.imageUrl !== originalImageUrl) {
        finalImageUrl = form.imageUrl;
      }

      if (!finalImageUrl) {
        throw new Error('Failed to get image URL');
      }

      // Calculate new status
      const now = new Date();
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);
      
      let status: 'draft' | 'upcoming' | 'active' | 'expired' = 'draft';
      
      if (form.publishType === 'scheduled') {
        if (isBefore(now, startDate)) {
          status = 'upcoming';
        } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
          status = 'active';
        } else {
          status = 'expired';
        }
      } else {
        status = 'draft';
      }

      const sliderRef = doc(db, 'sliders', sliderId);
      await updateDoc(sliderRef, {
        title: trimmedTitle,
        imageUrl: finalImageUrl,
        category: selectedCategories,
        status: status,
        publishType: form.publishType,
        startDate: Timestamp.fromDate(new Date(form.startDate)),
        endDate: Timestamp.fromDate(new Date(form.endDate)),
        updatedAt: serverTimestamp(),
      });

      alert('Slider updated successfully!');
      router.push('/sliders');
    } catch (error) {
      console.error('Error updating slider:', error);
      alert('Failed to update slider');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (loadingSlider) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading slider...</p>
          </div>
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
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Slider</h1>
              <p className="text-gray-600">Update your banner information</p>
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
                  <button type="button" onClick={() => setImageSource('upload')}
                    className={`pb-3 font-medium border-b-4 transition cursor-pointer ${
                      imageSource === 'upload' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent'
                    }`}>
                    <Upload className="w-5 h-5 inline mr-2" /> Upload
                  </button>
                  <button type="button" onClick={() => setImageSource('url')}
                    className={`pb-3 font-medium border-b-4 transition cursor-pointer ${
                      imageSource === 'url' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent'
                    }`}>
                    <Link className="w-5 h-5 inline mr-2" /> URL
                  </button>
                </div>

                {/* Upload Area */}
                {imageSource === 'upload' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition">
                    {preview ? (
                      <div className="relative">
                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain shadow" />
                        <button type="button" onClick={() => {
                            setPreview('');
                            setSelectedFile(null);
                            if (originalImageUrl) {
                              setPreview(originalImageUrl);
                              setForm(prev => ({ ...prev, imageUrl: originalImageUrl }));
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="font-medium mb-2">Click to upload new image</p>
                        <p className="text-sm text-gray-600">Recommended: 1920×600px • JPG, PNG, WebP</p>
                        {originalImageUrl && (
                          <p className="text-sm text-green-600 mt-2">
                            Current image will be replaced
                          </p>
                        )}
                      </>
                    )}

                    <input type="file" accept="image/*" onChange={handleFileSelect} id="upload-input" className="hidden" />
                    <label htmlFor="upload-input"
                      className="cursor-pointer mt-4 inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-md">
                      {uploading ? 'Uploading...' : 'Select New Image'}
                    </label>
                  </div>
                )}

                {/* URL Input */}
                {imageSource === 'url' && (
                  <div className="space-y-4">
                    <input type="url" value={form.imageUrl} onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                    {preview && (
                      <div className="relative">
                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain shadow" />
                        <button type="button" onClick={() => {
                            setPreview('');
                            setForm(prev => ({ ...prev, imageUrl: '' }));
                            if (originalImageUrl) {
                              setPreview(originalImageUrl);
                              setForm(prev => ({ ...prev, imageUrl: originalImageUrl }));
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {originalImageUrl && form.imageUrl !== originalImageUrl && (
                      <p className="text-sm text-yellow-600">
                        Current image URL will be replaced with the new one
                      </p>
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
                  <input type="text" required value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                    placeholder="e.g. Summer Mega Sale!" />
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
                            <span key={catId} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {cat?.name || catId}
                              <button type="button" onClick={() => removeCategory(catId)} className="hover:bg-purple-200 rounded-full p-0.5">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })
                      )}

                      {/* Dropdown Trigger */}
                      <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)} className="ml-auto flex items-center text-gray-600 hover:text-purple-600">
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
                            <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                              className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition ${
                                selectedCategories.includes(cat.id) ? 'bg-purple-100 text-purple-800 font-medium' : ''
                              }`}>
                              <div className="flex items-center justify-between">
                                <span>{cat.name}</span>
                                {selectedCategories.includes(cat.id) && <span className="text-purple-600">✓</span>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">Click to add/remove categories</p>
                </div>

                {/* Publish Type */}
                <div>
                  <label className="block text-base font-medium mb-2">
                    Publish Type <span className="text-red-500">*</span>
                  </label>
                  <select value={form.publishType} onChange={(e) => setForm(prev => ({ ...prev, publishType: e.target.value as 'draft' | 'scheduled' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none">
                    <option value="draft">Draft (Save without publishing)</option>
                    <option value="scheduled">Scheduled (Auto publish based on dates)</option>
                  </select>
                  
                  {/* Status Preview */}
                  {/* <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Status:</span>
                      <span className={`font-semibold ${currentStatus.color}`}>
                        {currentStatus.label}
                      </span>
                    </div>
                    {form.publishType === 'scheduled' && (
                      <div className="mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Status will update automatically based on dates</span>
                        </div>
                        <div className="mt-1">
                          • <span className="text-blue-600">Upcoming</span> → <span className="text-green-600">Active</span> (on start date)
                        </div>
                        <div>
                          • <span className="text-green-600">Active</span> → <span className="text-gray-600">Expired</span> (after end date)
                        </div>
                      </div>
                    )}
                  </div> */}
                </div>

                {/* Status Display */}
                <div>
                  <label className="block text-base font-medium mb-2">Current Status</label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className={`font-medium ${currentStatus.color}`}>
                      {currentStatus.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.publishType === 'draft' 
                        ? 'Draft sliders stay as drafts' 
                        : 'Auto-calculated based on dates'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium mb-2">
                    Start Date {form.publishType === 'scheduled' && <span className="text-red-500">*</span>}
                  </label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                    disabled={form.publishType === 'draft'} />
                  {form.publishType === 'draft' && (
                    <p className="text-xs text-gray-500 mt-1">Optional for drafts</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium mb-2">
                    End Date {form.publishType === 'scheduled' && <span className="text-red-500">*</span>}
                  </label>
                  <input type="date" value={form.endDate} min={form.publishType === 'scheduled' ? form.startDate : undefined}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                    disabled={form.publishType === 'draft'} />
                  {form.publishType === 'draft' && (
                    <p className="text-xs text-gray-500 mt-1">Optional for drafts</p>
                  )}
                </div>

                {/* Date Preview */}
                {form.publishType === 'scheduled' && (
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Schedule Preview</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">Upcoming</div>
                        <div className="text-xs text-gray-600">Until</div>
                        <div className="font-semibold">{format(new Date(form.startDate), 'dd MMM yyyy')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">Active</div>
                        <div className="text-xs text-gray-600">From → To</div>
                        <div className="font-semibold">
                          {format(new Date(form.startDate), 'dd MMM')} → {format(new Date(form.endDate), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-600">Expired</div>
                        <div className="text-xs text-gray-600">After</div>
                        <div className="font-semibold">{format(new Date(form.endDate), 'dd MMM yyyy')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button type="button" onClick={() => router.back()}
                  className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading || uploading || selectedCategories.length === 0}
                  className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-70 cursor-pointer">
                  {loading ? 'Updating...' : 'Update Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}