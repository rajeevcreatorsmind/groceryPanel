// src/app/orders/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Search, Plus, MoreVertical, Eye, Edit, Trash2, 
  Calendar, Users, Package, Truck, DollarSign, ShoppingBag,
  Clock, CheckCircle, XCircle, ArrowLeft
} from '@/components/icons';
import { format } from 'date-fns';
import Link from 'next/link';

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
  itemsCount: number;
  deliveryType: 'delivery' | 'pickup';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: any; // Firebase Timestamp
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
    const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    packed: orders.filter(o => o.status === 'packed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case 'confirmed': return { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmed' };
      case 'packed': return { icon: Package, color: 'bg-purple-100 text-purple-800', label: 'Packed' };
      case 'delivered': return { icon: Truck, color: 'bg-green-100 text-green-800', label: 'Delivered' };
      case 'cancelled': return { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' };
      default: return { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'dd MMM yyyy, hh:mm a');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
              <p className="text-purple-600 font-medium mt-1">{orders.length} total orders</p>
            </div>
             <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg font-medium cursor-pointer transition"
    >
      <ArrowLeft className="w-5 h-5" />
      Back
    </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold mt-2">{statusCounts.all}</p>
                </div>
                <ShoppingBag className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{statusCounts.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Confirmed</p>
                  <p className="text-3xl font-bold mt-2 text-blue-600">{statusCounts.confirmed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Packed</p>
                  <p className="text-3xl font-bold mt-2 text-purple-600">{statusCounts.packed}</p>
                </div>
                <Package className="w-10 h-10 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{statusCounts.delivered}</p>
                </div>
                <Truck className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <DollarSign className="w-10 h-10 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order ID, name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
                  {[
                    { key: 'all', label: 'All Orders' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'confirmed', label: 'Confirmed' },
                    { key: 'packed', label: 'Packed' },
                    { key: 'delivered', label: 'Delivered' },
                    { key: 'cancelled', label: 'Cancelled' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-5 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                        statusFilter === key
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label} ({statusCounts[key as keyof typeof statusCounts]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Order ID</th>
                    <th className="text-left p-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Items</th>
                    <th className="text-left p-4 font-medium text-gray-700">Total</th>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-right p-4 font-medium text-gray-700 pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">No orders found</p>
                        <p className="text-sm mt-2">Try changing your search or filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const { icon: StatusIcon, color, label } = getStatusInfo(order.status);
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{order.orderNo || order.id}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.customerPhone}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {label}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">
                            {order.itemsCount} items<br />
                            <span className="text-sm capitalize text-gray-500">{order.deliveryType}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-lg">₹{order.total?.toLocaleString('en-IN') || '0'}</p>
                            <p className={`text-sm capitalize ${
                              order.paymentStatus === 'paid' ? 'text-green-600' :
                              order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {order.paymentStatus}
                            </p>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end">
                              <div className="relative group">
                                <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                                  <MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>

                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                  <Link
                                    href={`/orders/${order.id}`}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </Link>
                                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                                    <Edit className="w-4 h-4" />
                                    Edit Order
                                  </button>
                                  <button className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                    Cancel Order
                                  </button>
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
      </main>
    </div>
  );
}