'use client';

import Sidebar from '@/components/Sidebar';
import { DollarSign, CreditCard, Banknote, CheckCircle, XCircle, Clock, Filter, Download } from '@/components/icons';
import { useState } from 'react';

export default function PaymentsPage() {
  const [filter, setFilter] = useState('all');

  const payments = [
    { id: '#PAY-001', customer: 'Rahul Sharma', amount: 2499, method: 'Credit Card', status: 'completed', date: '2024-01-15' },
    { id: '#PAY-002', customer: 'Priya Patel', amount: 1599, method: 'UPI', status: 'pending', date: '2024-01-15' },
    { id: '#PAY-003', customer: 'Amit Kumar', amount: 3299, method: 'Net Banking', status: 'completed', date: '2024-01-14' },
    { id: '#PAY-004', customer: 'Neha Singh', amount: 899, method: 'COD', status: 'failed', date: '2024-01-14' },
    { id: '#PAY-005', customer: 'Vikram Mehta', amount: 4299, method: 'Credit Card', status: 'completed', date: '2024-01-13' },
    { id: '#PAY-006', customer: 'Sonia Reddy', amount: 1999, method: 'UPI', status: 'pending', date: '2024-01-13' },
    { id: '#PAY-007', customer: 'Rajesh Nair', amount: 2799, method: 'Debit Card', status: 'completed', date: '2024-01-12' },
    { id: '#PAY-008', customer: 'Anjali Gupta', amount: 3499, method: 'Net Banking', status: 'completed', date: '2024-01-12' },
  ];

  const paymentMethods = [
    { method: 'Credit Card', count: 245, amount: 524560 },
    { method: 'UPI', count: 389, amount: 789230 },
    { method: 'Net Banking', count: 123, amount: 312450 },
    { method: 'COD', count: 156, amount: 284560 },
    { method: 'Debit Card', count: 98, amount: 198760 },
  ];

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status === filter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10 lg:p-12 ml-0 md:ml-64">
        <div className="flex justify-between items-center mb-8">
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

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹21,04,560</p>
                <p className="text-green-600 text-sm mt-1">This month</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹45,200</p>
                <p className="text-yellow-600 text-sm mt-1">Require action</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹12,400</p>
                <p className="text-red-600 text-sm mt-1">Need review</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                  {method.method === 'Credit Card' ? <CreditCard className="w-6 h-6" /> :
                   method.method === 'UPI' ? <Banknote className="w-6 h-6" /> :
                   <DollarSign className="w-6 h-6" />}
                </div>
                <p className="font-bold text-gray-900">{method.method}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₹{method.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{method.count} transactions</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <div className="flex gap-2">
              {['all', 'completed', 'pending', 'failed'].map((status) => (
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
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Payment ID</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{payment.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{payment.customer}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900">₹{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-700">{payment.method}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusColors[payment.status as keyof typeof statusColors]}`}>
                        <StatusIcon status={payment.status} />
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payment.date}</td>
                    <td className="py-3 px-4">
                      <button className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}