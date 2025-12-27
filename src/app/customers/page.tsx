'use client';

import Sidebar from '@/components/Sidebar';
import { Users, Phone, Mail, MapPin, Calendar, Search, Loader2 } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: any; // Timestamp or Date
  lastOrder?: any;
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

      // If you store customers separately
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('joinedAt', 'desc'));
      const snapshot = await getDocs(q);

      // If no dedicated customers collection, you can aggregate from orders later
      const fetched: Customer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.customerName || 'Unknown',
          phone: data.phone || data.phoneNumber || 'N/A',
          email: data.email || '',
          address: data.address || data.deliveryAddress || '',
          city: data.city || '',
          totalOrders: data.totalOrders || 0,
          totalSpent: Number(data.totalSpent || 0),
          joinedAt: data.joinedAt || data.createdAt,
          lastOrder: data.lastOrder,
        };
      });

      setCustomers(fetched);
      setFilteredCustomers(fetched);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    const filtered = customers.filter((customer) =>
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
    return date.toLocaleDateString('en-IN');
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            Customers
          </h1>
          <p className="text-gray-600 mt-2">Manage and view all registered customers</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg p-6">
            <p className="text-sm opacity-90">Avg. Order Value</p>
            <p className="text-3xl font-bold mt-2">
              ₹{customers.length > 0
                ? Math.round(
                    customers.reduce((sum, c) => sum + c.totalSpent, 0) /
                    customers.reduce((sum, c) => sum + c.totalOrders, 0) || 1
                  ).toLocaleString('en-IN')
                : 0}
            </p>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Customers</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Location</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-700">Orders</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Total Spent</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</p>
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
                              <span className="text-sm">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {customer.city || 'N/A'}
                            {customer.address && <span className="block text-xs text-gray-500 truncate max-w-xs">{customer.address}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">
                          ₹{customer.totalSpent.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
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