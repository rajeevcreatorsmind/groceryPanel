'use client';

import Sidebar from '@/components/Sidebar';
import { Users, Phone, Mail, MapPin, Calendar, Search, Loader2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Image from 'next/image';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  totalOrders?: number;
  totalSpent?: number;
  joinedAt: any;
  photoURL?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      console.log('Current auth user:', auth.currentUser?.uid, auth.currentUser?.email);

      const usersRef = collection(db, 'Users');
      // Removed orderBy to avoid issues with missing createdAt
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      console.log('Fetched documents count:', snapshot.docs.length);
      snapshot.docs.forEach((doc) => {
        console.log('Document ID:', doc.id, 'Data:', doc.data());
      });

      const fetched: Customer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.userName || data.displayName || data.name || 'Unknown User',
          phone: data.mobileNo || data.phoneNumber || data.phone || 'N/A',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          photoURL: data.userImg || data.photoURL || '',
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          joinedAt: data.createdAt || new Date(), // Fallback to now
        };
      });

      setCustomers(fetched);
      setFilteredCustomers(fetched);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to load customers. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-green-600" />
            Customers
          </h1>
          <p className="text-gray-600">Manage and view all registered customers</p>
        </div>

        {/* Search Bar */}
        <div className="mt-8 mb-6 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ₹{customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
<div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg p-6">
  <p className="text-sm opacity-90">Avg. Order Value</p>
  <p className="text-3xl font-bold mt-2">
    {customers.length === 0 || customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) === 0
      ? '₹0'
      : '₹' + Math.round(
          customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) /
          customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
        ).toLocaleString('en-IN')}
  </p>
</div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">All Customers ({filteredCustomers.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Location</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-700">Orders</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Spent</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-500">
                      {searchTerm ? 'No customers match your search' : 'No customers found'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {customer.photoURL ? (
                            <Image
                              src={customer.photoURL}
                              alt={customer.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm truncate max-w-xs">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {customer.city || customer.address ? (
                            <>
                              {customer.city && <span>{customer.city}</span>}
                              {customer.address && (
                                <span className="block text-xs text-gray-500 truncate max-w-xs">
                                  {customer.address}
                                </span>
                              )}
                            </>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {customer.totalOrders || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(customer.joinedAt)}</span>
                        </div>
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