'use client';

import Sidebar from '@/components/Sidebar';
import { MessageSquare, Star, Filter, Reply, Trash2, Check, X } from '@/components/icons';
import { useState } from 'react';

export default function FeedbackPage() {
  const [filter, setFilter] = useState('all');

  const feedbacks = [
    { id: 1, user: 'Rahul Sharma', rating: 5, comment: 'Excellent service! Fresh groceries delivered on time. Highly recommended!', date: '2024-01-15', status: 'published' },
    { id: 2, user: 'Priya Patel', rating: 4, comment: 'Good quality products but delivery was late by 30 minutes.', date: '2024-01-14', status: 'published' },
    { id: 3, user: 'Amit Kumar', rating: 3, comment: 'Some vegetables were not fresh. Need to improve quality check.', date: '2024-01-14', status: 'pending' },
    { id: 4, user: 'Neha Singh', rating: 5, comment: 'Best prices in town! Saved a lot on monthly groceries.', date: '2024-01-13', status: 'published' },
    { id: 5, user: 'Vikram Mehta', rating: 2, comment: 'Missing items in my order. Customer support was helpful though.', date: '2024-01-13', status: 'pending' },
    { id: 6, user: 'Sonia Reddy', rating: 4, comment: 'App is easy to use. Would love more payment options.', date: '2024-01-12', status: 'published' },
    { id: 7, user: 'Rajesh Nair', rating: 5, comment: 'Weekly subscription saved me time and money! Thank you!', date: '2024-01-12', status: 'published' },
    { id: 8, user: 'Anjali Gupta', rating: 1, comment: 'Package was damaged. Very disappointed.', date: '2024-01-11', status: 'pending' },
  ];

  const ratings = [
    { stars: 5, count: 245, percent: 65 },
    { stars: 4, count: 89, percent: 24 },
    { stars: 3, count: 23, percent: 6 },
    { stars: 2, count: 12, percent: 3 },
    { stars: 1, count: 8, percent: 2 },
  ];

  const filteredFeedbacks = filter === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.status === filter);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10 lg:p-12 ml-0 md:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feed Back</h1>
            <p className="text-gray-600 mt-2">Customer reviews and feedback management</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium">
            <Filter className="w-5 h-5" />
            Filter Options
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">377</p>
                <p className="text-green-600 text-sm mt-1">+24 this week</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">4.2</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-1">Excellent</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
                <p className="text-yellow-600 text-sm mt-1">Need action</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">92%</p>
                <p className="text-green-600 text-sm mt-1">+5% this month</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Reply className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Distribution */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Rating Distribution</h2>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.stars} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{rating.stars} Star</span>
                        <div className="flex gap-0.5">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">{rating.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full" 
                        style={{ width: `${rating.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Feedback</h2>
                <div className="flex gap-2">
                  {['all', 'published', 'pending'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg ${filter === status ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {filteredFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{feedback.user}</h3>
                        <p className="text-sm text-gray-500 mt-1">{feedback.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${feedback.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {feedback.status === 'published' ? 'Published' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      {renderStars(feedback.rating)}
                    </div>

                    <p className="text-gray-700 mb-6">{feedback.comment}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                        {feedback.status === 'pending' && (
                          <>
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                      <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}