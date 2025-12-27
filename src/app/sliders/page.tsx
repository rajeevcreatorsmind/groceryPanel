'use client';

import Sidebar from '@/components/Sidebar';
import { Images, Plus, Eye, Calendar, MoreVertical, X, Edit, Trash2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { deleteObject, ref } from 'firebase/storage';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Slider {
  id: string;
  title: string;
  imageUrl: string;
  status: 'active' | 'upcoming' | 'expired' | 'draft';
  startDate: any;
  endDate: any;
  clicks: number;
}

export default function SlidersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'expired' | 'draft'>('all');
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for image preview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>('');

  const openModal = (imageUrl: string) => {
    if (imageUrl) {
      setModalImage(imageUrl);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage('');
  };

  useEffect(() => {
    const q = query(collection(db, 'sliders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Slider));
      setSliders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSliders = activeTab === 'all' ? sliders : sliders.filter(s => s.status === activeTab);

  const activeCount = sliders.filter(s => s.status === 'active').length;
  const upcomingCount = sliders.filter(s => s.status === 'upcoming').length;
  const totalClicks = sliders.reduce((sum, s) => sum + (s.clicks || 0), 0);
  const bestPerforming = sliders.reduce((best, curr) => 
    (curr.clicks || 0) > (best?.clicks || 0) ? curr : best, null as Slider | null);

  const handleDelete = async (slider: Slider) => {
    if (!confirm('Are you sure you want to delete this slider permanently?')) return;
    try {
      if (slider.imageUrl) {
        const imageRef = ref(storage, slider.imageUrl);
        await deleteObject(imageRef).catch(() => {});
      }
      await deleteDoc(doc(db, 'sliders', slider.id));
    } catch (err) {
      alert('Failed to delete slider');
    }
  };

  const formatDate = (ts: any) => ts ? format(ts.toDate(), 'dd MMM yyyy') : '-';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading sliders...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Image Sliders</h1>
              <p className="text-gray-600 mt-2">Manage homepage banner sliders and promotions</p>
            </div>
            <button
              onClick={() => router.push('/sliders/create')}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add New Slider
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Sliders</p>
                  <p className="text-3xl font-bold mt-2">{activeCount}</p>
                </div>
                <div className="p-4 bg-green-500 rounded-xl">
                  <Images className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Clicks</p>
                  <p className="text-3xl font-bold mt-2">{totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-500 rounded-xl">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-3xl font-bold mt-2">{upcomingCount}</p>
                </div>
                <div className="p-4 bg-yellow-500 rounded-xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Best Performing</p>
                  <p className="text-lg font-bold mt-2 truncate max-w-[180px]">{bestPerforming?.title || 'N/A'}</p>
                  <p className="text-sm text-green-600 mt-1">{bestPerforming ? `${bestPerforming.clicks.toLocaleString()} clicks` : '-'}</p>
                </div>
                <div className="p-4 bg-purple-500 rounded-xl">
                  <Images className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            {/* Tabs */}
            <div className="p-6 border-b">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(['all', 'active', 'upcoming', 'expired', 'draft'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? sliders.length : filteredSliders.length})
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Banner</th>
                    <th className="text-left p-4 font-medium text-gray-700">Title</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Dates</th>
                    <th className="text-left p-4 font-medium text-gray-700">Clicks</th>
                    <th className="text-right p-4 font-medium text-gray-700 pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSliders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">
                        No sliders found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredSliders.map((slider) => (
                      <tr key={slider.id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="w-32 h-20 rounded-lg overflow-hidden border bg-gray-100">
                            {slider.imageUrl ? (
                              <img
                                src={slider.imageUrl}
                                alt={slider.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                                <Images className="w-8 h-8 text-white/50" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{slider.title}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(slider.status)}`}>
                            {slider.status.charAt(0).toUpperCase() + slider.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(slider.startDate)} → {formatDate(slider.endDate)}
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">
                          {(slider.clicks || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end">
                            <div className="relative group">
                              <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </button>

                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                <button
                                  onClick={() => openModal(slider.imageUrl)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview Image
                                </button>
                                <button
                                  onClick={() => router.push(`/sliders/edit/${slider.id}`)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(slider)}
                                  className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="relative max-w-6xl w-full max-h-full">
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
              <img
                src={modalImage}
                alt="Slider Preview"
                className="w-full h-full object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}