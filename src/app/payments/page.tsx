'use client';

import Sidebar from '@/components/Sidebar';
import { DollarSign, CreditCard, Banknote, CheckCircle, XCircle, Clock, Filter, Download, Loader2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Payment {
  id: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: 'cod' | 'online' | 'upi' | 'credit_card' | 'debit_card' | 'net_banking';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt: any; // Timestamp or Date
  orderId?: string;
}

export default function PaymentsPage() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Adjust collection name if your payments/orders are stored elsewhere
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const fetchedPayments: Payment[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerName: data.customerName || data.name || 'Unknown Customer',
          totalAmount: Number(data.totalAmount || 0),
          paymentMethod: data.paymentMethod || 'cod',
          status: determineStatus(data),
          createdAt: data.createdAt,
          orderId: data.orderId || doc.id,
        };
      });

      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  // Determine payment status based on order/delivery status
  const determineStatus = (data: any): 'completed' | 'pending' | 'failed' => {
    if (data.status === 'delivered' && data.paymentMethod !== 'cod') return 'completed';
    if (data.status === 'delivered' && data.paymentMethod === 'cod') return 'pending'; // COD collected later
    if (['pending', 'accepted', 'picked'].includes(data.status)) return 'pending';
    if (['rejected', 'canceled', 'failed'].includes(data.status)) return 'failed';
    return 'pending';
  };

  // Calculate stats from real data
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending' && p.paymentMethod === 'cod')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const failedAmount = payments
    .filter(p => p.status === 'failed')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  // Payment method distribution
  const methodStats = payments.reduce((acc, p) => {
    const method = formatMethodName(p.paymentMethod);
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 };
    }
    acc[method].count++;
    acc[method].amount += p.totalAmount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const paymentMethods = Object.entries(methodStats).map(([method, stats]) => ({
    method,
    count: stats.count,
    amount: stats.amount,
  }));

  const formatMethodName = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Credit Card';
      case 'debit_card': return 'Debit Card';
      case 'net_banking': return 'Net Banking';
      case 'online': return 'UPI / Online';
      default: return method.toUpperCase();
    }
  };

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800', 
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter(p => p.status === filter);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading payments data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-full mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-2">Manage and track all payment transactions</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Real Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-green-600 text-sm mt-1">Collected (Online)</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending (COD)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{pendingAmount.toLocaleString('en-IN')}</p>
                <p className="text-yellow-600 text-sm mt-1">To be collected</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed / Cancelled</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{failedAmount.toLocaleString('en-IN')}</p>
                <p className="text-red-600 text-sm mt-1">Lost revenue</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Real Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                    {method.method.includes('Credit') || method.method.includes('Debit') ? <CreditCard className="w-6 h-6" /> :
                     method.method.includes('UPI') || method.method.includes('Online') ? <Banknote className="w-6 h-6" /> :
                     <DollarSign className="w-6 h-6" />}
                  </div>
                  <p className="font-bold text-gray-900">{method.method}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">₹{method.amount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-500">{method.count} transactions</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <div className="flex gap-2">
              {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">#{payment.orderId || payment.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{payment.customerName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">₹{payment.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{formatMethodName(payment.paymentMethod)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusColors[payment.status]}`}>
                          <StatusIcon status={payment.status} />
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(payment.createdAt)}</td>
                      <td className="py-3 px-4">
                        <button className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}