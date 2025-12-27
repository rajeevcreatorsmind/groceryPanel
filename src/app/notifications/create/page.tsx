// src/app/notifications/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Bell, Users, Bike, Image, Plus, CheckCircle2, Loader2, X, Send, ArrowBigLeft  } from '@/components/icons';

export default function CreateNotificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'customers' as 'customers' | 'delivery',
    type: 'info' as 'info' | 'promotion' | 'alert',
    imageUrl: '' as string,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `notifications/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      alert('Image upload failed');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'Notifications'), {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        target: formData.target,
        imageUrl: formData.imageUrl || null,
        sentAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => router.push('/notifications'), 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to send');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

        <div className="w-full max-w-full mx-auto"> 

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/notifications')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm font-medium cursor-pointer"
            >
              <ArrowBigLeft  className="w-6 h-6" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
            <p className="text-gray-600 text-sm mt-1">Choose target and send message</p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-semibold">Sent successfully!</p>
                <p className="text-sm">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Target */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Send To</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target: 'customers' })}
                    className={`p-5 rounded-xl border-2 flex flex-col items-center cursor-pointer ${
                      formData.target === 'customers'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <Users className="w-10 h-10 text-purple-600 mb-2" />
                    <p className="font-medium">Customers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target: 'delivery' })}
                    className={`p-5 rounded-xl border-2 flex flex-col items-center cursor-pointer ${
                      formData.target === 'delivery'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <Bike className="w-10 h-10 text-purple-600 mb-2" />
                    <p className="font-medium">Delivery Boys</p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={2}
                  placeholder="Write message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  required
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Image (Optional)</label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-50">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Click to upload image</p>
                    </div>
                  </label>
                )}
                {uploadingImage && <p className="text-sm text-purple-600 mt-2">Uploading...</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'info' })}
                    className={`p-4 rounded-xl border-2 ${formData.type === 'info' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                  >
                    <Bell className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">Info</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'promotion' })}
                    className={`p-4 rounded-xl border-2 ${formData.type === 'promotion' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}
                  >
                    <Bell className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">Promotion</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'alert' })}
                    className={`p-4 rounded-xl border-2 ${formData.type === 'alert' ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}
                  >
                    <Bell className="w-8 h-8 text-red-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">Alert</p>
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/notifications')}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || uploadingImage}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Send Notification
                      
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}