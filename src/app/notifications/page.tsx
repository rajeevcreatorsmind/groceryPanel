// src/app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Bell, Users, Bike, Search, Clock, MoreVertical, X , Send} from '@/components/icons';
import { format } from 'date-fns';
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promotion' | 'alert';
  target: 'customers' | 'delivery';
  imageUrl: string | null;
  sentAt: { toDate: () => Date } | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'customers' | 'delivery'>('all');

  // Modal for image preview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>('');

  const openModal = (url: string) => {
    if (url) {
      setModalImage(url);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage('');
  };

  useEffect(() => {
    const q = query(collection(db, 'Notifications'), orderBy('sentAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter by search
  const searched = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  // Filter by tab
  const filtered = activeTab === 'all' 
    ? searched 
    : searched.filter((n) => n.target === activeTab);

  // Counts for tabs
  const allCount = notifications.length;
  const customersCount = notifications.filter(n => n.target === 'customers').length;
  const deliveryCount = notifications.filter(n => n.target === 'delivery').length;

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'alert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (ts: any) =>
    ts ? format(ts.toDate(), 'dd MMM yyyy, hh:mm a') : 'Just now';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading notifications...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Sent Notifications</h1>
              <p className="text-gray-600 mt-2">
                All notifications sent to customers and delivery partners
              </p>
              <p className="text-purple-600 font-medium mt-1">
                {allCount} total sent
              </p>
            </div>
            <Link
              href="/notifications/create"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium"
            >
              <Bell className="w-5 h-5" />
              Send New Notification
              <Send className="w-5 h-5" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Table Card with Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            {/* Tabs */}
            <div className="p-6 border-b">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(['all', 'customers', 'delivery'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab === 'customers' ? 'Customers' : 'Delivery Partners'}{' '}
                    ({tab === 'all' ? allCount : tab === 'customers' ? customersCount : deliveryCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Image</th>
                    <th className="text-left p-4 font-medium text-gray-700">Title</th>
                    <th className="text-left p-4 font-medium text-gray-700">Message</th>
                    <th className="text-left p-4 font-medium text-gray-700">Type</th>
                    <th className="text-left p-4 font-medium text-gray-700">Target</th>
                    <th className="text-left p-4 font-medium text-gray-700">Sent At</th>
                    <th className="text-right p-4 font-medium text-gray-700 pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">
                          {search
                            ? 'No notifications match your search.'
                            : activeTab === 'all'
                            ? 'No notifications sent yet.'
                            : `No notifications sent to ${activeTab === 'customers' ? 'customers' : 'delivery partners'} yet.`}
                        </p>
                        {!search && (
                          <Link
                            href="/notifications/create"
                            className="text-purple-600 hover:underline mt-4 inline-block"
                          >
                            Send your first notification →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((notif) => {
                      const typeStyle = getTypeStyle(notif.type);
                      return (
                        <tr key={notif.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-4">
                            <div className="w-24 h-20 rounded-lg overflow-hidden border bg-gray-100">
                              {notif.imageUrl ? (
                                <img
                                  src={notif.imageUrl}
                                  alt={notif.title}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => openModal(notif.imageUrl!)}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                                  <Bell className="w-8 h-8 text-white/50" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-gray-900 max-w-xs truncate">
                              {notif.title}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-gray-700 max-w-md truncate">{notif.message}</p>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${typeStyle}`}
                            >
                              {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {notif.target === 'customers' ? (
                                <Users className="w-5 h-5 text-purple-600" />
                              ) : (
                                <Bike className="w-5 h-5 text-purple-600" />
                              )}
                              <span className="capitalize text-gray-700">
                                {notif.target === 'delivery' ? 'Delivery Partners' : 'Customers'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(notif.sentAt)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end">
                              <div className="relative group">
                                <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                                  <MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                  {notif.imageUrl && (
                                    <button
                                      onClick={() => openModal(notif.imageUrl!)}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                                    >
                                      <Bell className="w-4 h-4" />
                                      Preview Image
                                    </button>
                                  )}
                                  <div className="px-4 py-2 text-xs text-gray-500 border-t">
                                    Edit/Delete coming soon
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div className="relative max-w-5xl w-full max-h-full">
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
              <img
                src={modalImage}
                alt="Notification Preview"
                className="w-full h-full object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}