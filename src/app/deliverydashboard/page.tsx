'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  HandCoins,
  CreditCard,
  MapPin,
  Users,
  TrendingUp,
  Loader2
} from '@/components/icons';

// Define proper types for better TypeScript support
interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  deliveries: number;
  codEarnings: number;
}

interface BoyMap {
  [boyId: string]: {
    name: string;
    phone: string;
  };
}

interface TopBoy {
  name: string;
  deliveries: number;
  phone?: string;
  codEarnings?: number;
}

interface TopArea {
  name: string;
  count: number;
}

interface Stats {
  totalOrders: number;
  delivered: number;
  pending: number;
  cancelled: number;
  avgDeliveryTime: number;
  totalRevenue: number;
  codCollected: number;
  onlineCollected: number;
  topBoy: TopBoy | null;
  topArea: TopArea | null;
}

interface DeliveryOrder {
  id: string;
  status?: string;
  createdAt?: Timestamp | Date;
  deliveredAt?: Timestamp | Date;
  totalAmount?: string | number;
  paymentMethod?: 'cod' | 'online' | string;
  boys?: Array<{
    boyId: string;
    status?: string;
    boyName?: string;
    boyPhone?: string;
  }>;
  city?: string;
  area?: string;
  [key: string]: any; // For flexibility with other fields
}

export default function DeliveryDashboard() {
  const [deliveryData, setDeliveryData] = useState<DeliveryOrder[]>([]);
  const [boyStats, setBoyStats] = useState<Record<string, DeliveryBoy>>({});
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month

  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    cancelled: 0,
    avgDeliveryTime: 0,
    totalRevenue: 0,
    codCollected: 0,
    onlineCollected: 0,
    topBoy: null,
    topArea: null,
  });

  useEffect(() => {
    fetchDeliveryData();
  }, [timeFilter]);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);

      // Fetch approved delivery boys for name mapping
      const boysSnapshot = await getDocs(collection(db, 'boyDetails'));
      const boyMap: BoyMap = {};
      boysSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.approved && !['Suspended', 'Deleted'].includes(data.status)) {
          boyMap[doc.id] = {
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown Boy',
            phone: data.phoneNumber || 'N/A',
          };
        }
      });

      // Fetch all delivery notifications
      const q = query(collection(db, 'deliveryNotifications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let orders: DeliveryOrder[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryOrder));

      // Apply time filter
      const now = new Date();
      if (timeFilter === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0));
        orders = orders.filter(o => {
          const created = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : o.createdAt;
          return new Date(created || 0) >= today;
        });
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        orders = orders.filter(o => {
          const created = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : o.createdAt;
          return new Date(created || 0) >= weekAgo;
        });
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        orders = orders.filter(o => {
          const created = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : o.createdAt;
          return new Date(created || 0) >= monthAgo;
        });
      }

      // Calculate stats
      const totalOrders = orders.length;
      const delivered = orders.filter(o => o.status === 'delivered').length;
      const pending = orders.filter(o => ['pending', 'accepted', 'picked'].includes(o.status || '')).length;
      const cancelled = orders.filter(o => ['rejected', 'canceled'].includes(o.status || '')).length;

      // Average delivery time
      let totalTime = 0;
      let completedCount = 0;
      orders.forEach(order => {
        if (order.status === 'delivered' && order.createdAt && order.deliveredAt) {
          const start = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : order.createdAt;
          const end = order.deliveredAt instanceof Timestamp ? order.deliveredAt.toDate() : order.deliveredAt;
          totalTime += (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
          completedCount++;
        }
      });
      const avgDeliveryTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;

      // Revenue & collections
      let totalRevenue = 0;
      let codCollected = 0;
      let onlineCollected = 0;

      orders.forEach(order => {
        if (order.status === 'delivered') {
          const amount = parseFloat(order.totalAmount?.toString() || '0');
          totalRevenue += amount;
          if (order.paymentMethod === 'cod') codCollected += amount;
          else if (order.paymentMethod === 'online') onlineCollected += amount;
        }
      });

      // Boy performance
      const tempBoyStats: Record<string, DeliveryBoy> = {};
      orders.forEach(order => {
        order.boys?.forEach(boy => {
          if (boy.status === 'delivered') {
            const boyId = boy.boyId;
            if (!tempBoyStats[boyId]) {
              tempBoyStats[boyId] = {
                id: boyId,
                name: boyMap[boyId]?.name || boy.boyName || `Boy-${boyId.slice(0, 6)}`,
                phone: boyMap[boyId]?.phone || boy.boyPhone || 'N/A',
                deliveries: 0,
                codEarnings: 0,
              };
            }
            tempBoyStats[boyId].deliveries++;
            if (order.paymentMethod === 'cod') {
              tempBoyStats[boyId].codEarnings += parseFloat(order.totalAmount?.toString() || '0');
            }
          }
        });
      });

      // Top boy & area
      const sortedBoys = Object.values(tempBoyStats).sort((a, b) => b.deliveries - a.deliveries);
      const topBoy = sortedBoys[0] ? {
        name: sortedBoys[0].name,
        deliveries: sortedBoys[0].deliveries,
        phone: sortedBoys[0].phone,
        codEarnings: sortedBoys[0].codEarnings,
      } : null;

      const areaCount: Record<string, number> = {};
      orders.forEach(o => {
        const area = o.city || o.area || 'Unknown';
        areaCount[area] = (areaCount[area] || 0) + 1;
      });
      const topAreaEntry = Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0];
      const topArea = topAreaEntry ? { name: topAreaEntry[0], count: topAreaEntry[1] } : null;

      // Update state
      setDeliveryData(orders);
      setBoyStats(tempBoyStats);
      setStats({
        totalOrders,
        delivered,
        pending,
        cancelled,
        avgDeliveryTime,
        totalRevenue,
        codCollected,
        onlineCollected,
        topBoy,
        topArea,
      });

    } catch (error) {
      console.error('Error fetching delivery data:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar /> {/* Moved Sidebar to the left as a proper fixed/adjustable sidebar */}

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="w-8 h-8 text-green-600" />
              Delivery Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time overview of grocery delivery performance</p>
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="mt-4 sm:mt-0 px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Stats Grid - 5 Cards per Row on Large Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600 opacity-80" />
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.delivered}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalOrders > 0 ? `${((stats.delivered / stats.totalOrders) * 100).toFixed(1)}% success` : '0%'}
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600 opacity-80" />
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-80" />
            </div>
          </div>

          {/* COD Collected */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">COD Collected</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">₹{stats.codCollected.toLocaleString('en-IN')}</p>
              </div>
              <HandCoins className="w-12 h-12 text-teal-600 opacity-80" />
            </div>
          </div>

          {/* Online Payments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Paid</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">₹{stats.onlineCollected.toLocaleString('en-IN')}</p>
              </div>
              <CreditCard className="w-12 h-12 text-purple-600 opacity-80" />
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Avg Delivery Time */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Avg Delivery Time</p>
                <p className="text-3xl font-bold mt-2">{stats.avgDeliveryTime} min</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="w-10 h-10 opacity-80" />
            </div>
          </div>

          {/* Top Delivery Boy */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Top Delivery Boy</p>
                <p className="text-xl font-bold mt-2 truncate">{stats.topBoy?.name || 'N/A'}</p>
                <p className="text-sm opacity-90">{stats.topBoy?.deliveries || 0} deliveries</p>
              </div>
              <Users className="w-10 h-10 opacity-80" />
            </div>
          </div>

          {/* Top Area */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Top Area</p>
                <p className="text-xl font-bold mt-2 truncate">{stats.topArea?.name || 'N/A'}</p>
                <p className="text-sm opacity-90">{stats.topArea?.count || 0} orders</p>
              </div>
              <MapPin className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Boy Performance Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
            <h2 className="text-2xl font-bold">Top Delivery Boys</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Deliveries</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">COD Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.values(boyStats).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No delivery data available
                    </td>
                  </tr>
                ) : (
                  Object.values(boyStats)
                    .sort((a, b) => b.deliveries - a.deliveries)
                    .slice(0, 10)
                    .map((boy, index) => (
                      <tr key={boy.id} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-orange-600' : 'bg-green-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{boy.name}</td>
                        <td className="px-6 py-4 text-gray-600">{boy.phone}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {boy.deliveries}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ₹{boy.codEarnings.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Delivery Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Delivered</span>
              <div className="flex items-center gap-4 w-64">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${stats.totalOrders > 0 ? (stats.delivered / stats.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium">{stats.delivered} ({stats.totalOrders > 0 ? ((stats.delivered / stats.totalOrders) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Pending</span>
              <div className="flex items-center gap-4 w-64">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${stats.totalOrders > 0 ? (stats.pending / stats.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium">{stats.pending}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Cancelled/Rejected</span>
              <div className="flex items-center gap-4 w-64">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-red-600 h-3 rounded-full" style={{ width: `${stats.totalOrders > 0 ? (stats.cancelled / stats.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-medium">{stats.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}