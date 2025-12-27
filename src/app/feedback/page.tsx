// src/app/feedback/page.tsx
'use client';

import Sidebar from '@/components/Sidebar';
import { MessageSquare, Star, Reply, Trash2, Check, X, Send } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  userName: string;
  userPhone?: string;
  rating: number;
  comment: string;
  status: 'published' | 'pending';
  adminReply?: string; // New field for reply
  createdAt: any;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');

  // For reply modal
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'feedback'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Feedback))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      setFeedbacks(data);
      setLoading(false);
    }, (error) => {
      console.error('Error:', error);
      alert('Failed to load feedback');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Stats calculations (same as before)
  const totalReviews = feedbacks.length;
  const publishedCount = feedbacks.filter(f => f.status === 'published').length;
  const pendingCount = feedbacks.filter(f => f.status === 'pending').length;

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = feedbacks.filter(f => f.rating === stars).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percent };
  });

  const filteredFeedbacks = filter === 'all' ? feedbacks : feedbacks.filter(f => f.status === filter);

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return format(timestamp.toDate(), 'dd MMM yyyy');
  };

  // Functions for actions
  const handleApprove = async (id: string) => {
    if (!confirm('Approve this feedback? It will be published.')) return;
    try {
      await updateDoc(doc(db, 'feedback', id), { status: 'published' });
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and delete this feedback?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
    } catch (error) {
      alert('Failed to reject');
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      alert('Please write a reply');
      return;
    }
    try {
      await updateDoc(doc(db, 'feedback', id), {
        adminReply: replyText.trim(),
      });
      setReplyText('');
      setReplyingTo(null);
      alert('Reply sent successfully!');
    } catch (error) {
      alert('Failed to send reply');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback permanently?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading feedback...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

 <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Feedback</h1>
              <p className="text-gray-600 mt-2">Manage reviews and improve customer satisfaction</p>
              <p className="text-purple-600 font-medium mt-1">{totalReviews} total reviews</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                  <p className="text-3xl font-bold mt-2">{totalReviews}</p>
                  <p className="text-green-600 text-sm mt-2">All time</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Rating</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-3xl font-bold">{averageRating}</span>
                    {renderStars(Math.round(parseFloat(averageRating)))}
                  </div>
                  <p className="text-green-600 text-sm mt-2">Based on {totalReviews} reviews</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded-xl">
                  <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Reviews</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{pendingCount}</p>
                  <p className="text-yellow-600 text-sm mt-2">Need approval</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{publishedCount}</p>
                  <p className="text-green-600 text-sm mt-2">Live on site</p>
                </div>
                <div className="p-4 bg-green-100 rounded-xl">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rating Distribution */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Rating Distribution</h2>
                <div className="space-y-6">
                  {ratingCounts.map((rating) => (
                    <div key={rating.stars} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">{rating.stars} Star</span>
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </div>
                        <span className="font-bold text-gray-900">{rating.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full transition-all"
                          style={{ width: `${rating.percent}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-right">{rating.percent}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Feedback</h2>
                  <div className="flex gap-3">
                    {(['all', 'published', 'pending'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-3 rounded-xl font-medium transition ${
                          filter === status ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}{' '}
                        ({status === 'all' ? totalReviews : status === 'published' ? publishedCount : pendingCount})
                      </button>
                    ))}
                  </div>
                </div>

                {filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">No feedback yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredFeedbacks.map((fb) => (
                      <div key={fb.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{fb.userName}</h3>
                            {fb.userPhone && <p className="text-sm text-gray-500 mt-1">{fb.userPhone}</p>}
                            <p className="text-sm text-gray-500 mt-2">{formatDate(fb.createdAt)}</p>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            fb.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fb.status === 'published' ? 'Published' : 'Pending Review'}
                          </span>
                        </div>

                        <div className="mb-5">{renderStars(fb.rating)}</div>

                        <p className="text-gray-700 text-lg leading-relaxed mb-6">{fb.comment}</p>

                        {/* Admin Reply (if exists) */}
                        {fb.adminReply && (
                          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6">
                            <p className="text-sm font-medium text-purple-800 mb-1">Admin Reply:</p>
                            <p className="text-gray-800">{fb.adminReply}</p>
                          </div>
                        )}

                        {/* Reply Input (when clicking Reply) */}
                        {replyingTo === fb.id && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                              rows={3}
                            />
                            <div className="flex gap-3 mt-3">
                              <button
                                onClick={() => handleReply(fb.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                              >
                                <Send className="w-4 h-4" />
                                Send Reply
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setReplyingTo(fb.id);
                                setReplyText('');
                              }}
                              className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 font-medium"
                            >
                              <Reply className="w-5 h-5" />
                              Reply
                            </button>

                            {fb.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(fb.id)}
                                  className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-medium"
                                >
                                  <Check className="w-5 h-5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(fb.id)}
                                  className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-medium"
                                >
                                  <X className="w-5 h-5" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}