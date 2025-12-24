'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  ShoppingBag, Clock, CheckCircle, XCircle, Truck, 
  AlertCircle, Eye, Edit, Trash2, Calendar, Users,
  ArrowUpDown, DollarSign, Package
} from 'lucide-react';

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
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Mock data - replace with API call
        const mockOrders: Order[] = [
          {
            id: '1',
            orderNo: 'ORD-001',
            customerName: 'John Doe',
            customerPhone: '+91 9876543210',
            total: 1250.75,
            status: 'pending',
            itemsCount: 3,
            deliveryType: 'delivery',
            paymentStatus: 'pending',
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            orderNo: 'ORD-002',
            customerName: 'Jane Smith',
            customerPhone: '+91 9876543211',
            total: 890.50,
            status: 'confirmed',
            itemsCount: 2,
            deliveryType: 'pickup',
            paymentStatus: 'paid',
            createdAt: '2024-01-15T09:15:00Z'
          },
          {
            id: '3',
            orderNo: 'ORD-003',
            customerName: 'Robert Johnson',
            customerPhone: '+91 9876543212',
            total: 2100.00,
            status: 'packed',
            itemsCount: 5,
            deliveryType: 'delivery',
            paymentStatus: 'paid',
            createdAt: '2024-01-14T16:45:00Z'
          },
          {
            id: '4',
            orderNo: 'ORD-004',
            customerName: 'Sarah Williams',
            customerPhone: '+91 9876543213',
            total: 750.25,
            status: 'delivered',
            itemsCount: 4,
            deliveryType: 'delivery',
            paymentStatus: 'paid',
            createdAt: '2024-01-14T14:20:00Z'
          },
          {
            id: '5',
            orderNo: 'ORD-005',
            customerName: 'Mike Brown',
            customerPhone: '+91 9876543214',
            total: 1560.00,
            status: 'cancelled',
            itemsCount: 3,
            deliveryType: 'delivery',
            paymentStatus: 'failed',
            createdAt: '2024-01-13T11:10:00Z'
          },
          {
            id: '6',
            orderNo: 'ORD-006',
            customerName: 'Emma Davis',
            customerPhone: '+91 9876543215',
            total: 950.00,
            status: 'pending',
            itemsCount: 2,
            deliveryType: 'pickup',
            paymentStatus: 'pending',
            createdAt: '2024-01-13T10:05:00Z'
          },
          {
            id: '7',
            orderNo: 'ORD-007',
            customerName: 'David Wilson',
            customerPhone: '+91 9876543216',
            total: 3200.50,
            status: 'confirmed',
            itemsCount: 6,
            deliveryType: 'delivery',
            paymentStatus: 'paid',
            createdAt: '2024-01-12T15:30:00Z'
          },
          {
            id: '8',
            orderNo: 'ORD-008',
            customerName: 'Lisa Taylor',
            customerPhone: '+91 9876543217',
            total: 680.75,
            status: 'delivered',
            itemsCount: 3,
            deliveryType: 'pickup',
            paymentStatus: 'paid',
            createdAt: '2024-01-12T12:45:00Z'
          }
        ];

        // Simulate API delay
        setTimeout(() => {
          setOrders(mockOrders);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
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

  // Get status icon and color
  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case 'confirmed':
        return { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmed' };
      case 'packed':
        return { icon: Package, color: 'bg-purple-100 text-purple-800', label: 'Packed' };
      case 'delivered':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' };
      case 'cancelled':
        return { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelled' };
      default:
        return { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all orders
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Calculate totals
  const totalRevenue = filteredOrders
    .filter(order => order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}

      <Sidebar />
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-2">Manage and track all customer orders</p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => router.push('/orders/new')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{statusCounts.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Packed</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{statusCounts.packed}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{statusCounts.delivered}</p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { key: 'all', label: 'All Orders', count: statusCounts.all },
              { key: 'pending', label: 'Pending', count: statusCounts.pending },
              { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
              { key: 'packed', label: 'Packed', count: statusCounts.packed },
              { key: 'delivered', label: 'Delivered', count: statusCounts.delivered },
              { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === key
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} <span className="ml-1 font-medium">({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-gray-600">
              {selectedOrders.length > 0 
                ? `${selectedOrders.length} selected` 
                : `${filteredOrders.length} orders`
              }
            </span>
          </div>
          
          <div className="flex gap-2">
            {selectedOrders.length > 0 && (
              <>
                <button className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  Bulk Update
                </button>
                <button className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  Delete Selected
                </button>
              </>
            )}
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="divide-y">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusInfo(order.status).icon;
              const statusColor = getStatusInfo(order.status).color;
              const statusLabel = getStatusInfo(order.status).label;

              return (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    
                    {/* Order Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Order Number & Date */}
                      <div className="md:col-span-3">
                        <div className="font-medium text-gray-900">{order.orderNo}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="md:col-span-3">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusLabel}
                        </div>
                      </div>

                      {/* Items Count */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Package className="w-4 h-4" />
                          {order.itemsCount} items
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {order.deliveryType}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="md:col-span-2">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{order.total.toFixed(2)}
                        </div>
                        <div className={`text-sm ${
                          order.paymentStatus === 'paid' 
                            ? 'text-green-600' 
                            : order.paymentStatus === 'failed'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button className="p-2 hover:bg-gray-200 rounded-lg">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      {/* Dropdown Menu (hidden by default) */}
                      <div className="hidden absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                        <button 
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Order
                        </button>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="border-t p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">1</button>
              <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">2</button>
              <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}