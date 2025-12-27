'use client';

import Sidebar from '@/components/Sidebar';
import { Tag, Plus, Search, Filter, Copy, Edit2, Trash2, Calendar, Users, CheckCircle2, Clock, AlertCircle, Loader2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  perUserLimit: number | null;
  startDate: string | null;
  expiryDate: string;
  description: string | null;
  createdAt: any;
  status: 'active' | 'upcoming' | 'expired';
};

export default function CouponsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine status based on dates
  const getCouponStatus = (coupon: any): 'active' | 'upcoming' | 'expired' => {
    const today = new Date();
    const expiry = new Date(coupon.expiryDate);
    const start = coupon.startDate ? new Date(coupon.startDate) : null;

    if (expiry < today) return 'expired';
    if (start && start > today) return 'upcoming';
    return 'active';
  };

  // Format discount display
  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `₹${value}`;
  };

  // Fetch coupons in real-time
  useEffect(() => {
    const q = query(collection(db, 'coupons'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const couponsData: Coupon[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          couponsData.push({
            id: doc.id,
            ...data,
            status: getCouponStatus(data),
          } as Coupon);
        });

        // Sort by creation date (newest first)
        couponsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());

        setCoupons(couponsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching coupons:', err);
        setError('Failed to load coupons. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || coupon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const activeCount = coupons.filter(c => c.status === 'active').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.currentUses, 0);
  const mostUsed = coupons.reduce((prev, current) =>
    prev.currentUses > current.currentUses ? prev : current, { currentUses: 0 } as Coupon
  );

  // Delete coupon
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'coupons', id));
      // Firestore will auto-update via onSnapshot
    } catch (err) {
      alert('Failed to delete coupon.');
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl max-w-md">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-600 mt-2">Create and manage discount coupons</p>
          </div>
          <button
            onClick={() => router.push('/coupons/create')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium transition-shadow cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create New Coupon
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</p>
                <p className="text-green-600 text-sm mt-1">Currently running</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Redemptions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{totalRedemptions.toLocaleString()}</p>
                <p className="text-blue-600 text-sm mt-1">Times used</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Coupons</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{coupons.length}</p>
                <p className="text-purple-600 text-sm mt-1">All time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Most Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {mostUsed.code || 'N/A'}
                </p>
                <p className="text-green-600 text-sm mt-1">{mostUsed.currentUses} times</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search coupons by code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
                <Filter className="w-5 h-5" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredCoupons.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No coupons found</p>
            <p className="text-gray-400 mt-2">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first coupon to get started'}
            </p>
          </div>
        )}

        {/* Coupons Table */}
        {filteredCoupons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium">Coupon Code</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Discount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Min. Order</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Usage</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Expiry</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCoupons.map((coupon) => {
                    const usagePercent = coupon.maxUses > 0 ? (coupon.currentUses / coupon.maxUses) * 100 : 0;

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg text-gray-900">{coupon.code}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(coupon.code)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xl font-bold text-purple-600">
                            {formatDiscount(coupon.discountType, coupon.discountValue)} OFF
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600 capitalize">{coupon.discountType}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-medium">
                            {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'No minimum'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{coupon.currentUses} / {coupon.maxUses}</span>
                              <span className="font-medium">{Math.round(usagePercent)}%</span>
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(coupon.status)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/coupons/edit/${coupon.id}`)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}