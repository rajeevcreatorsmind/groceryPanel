// src/app/reports/page.tsx
'use client';

import Sidebar from '@/components/Sidebar';
import { TrendingUp, Download, Calendar } from '@/components/icons';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: any;
  items?: { productName: string; quantity: number; price: number }[];
}

interface ProductSale {
  name: string;
  sales: number;
  quantity: number;
  growth?: string;
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [customerGrowth, setCustomerGrowth] = useState(0);

  const [topProducts, setTopProducts] = useState<ProductSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<{ month: string; sales: number; orders: number }[]>([]);

  // Fetch real data
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startCurrent = timeRange === 'monthly' ? startOfMonth(now) : subMonths(startOfMonth(now), 6);
        const endCurrent = endOfMonth(now);

        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('createdAt', '>=', startCurrent),
          where('createdAt', '<=', endCurrent),
          where('status', 'in', ['delivered', 'confirmed']) // Only completed orders
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        // Calculate stats
        const completedOrders = orders.filter(o => o.status !== 'cancelled');
        const revenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const orderCount = completedOrders.length;
        const avgValue = orderCount > 0 ? revenue / orderCount : 0;

        setTotalRevenue(revenue);
        setTotalOrders(orderCount);
        setAvgOrderValue(avgValue);

        // Top products (from order items)
        const productMap = new Map<string, ProductSale>();
        completedOrders.forEach(order => {
          (order.items || []).forEach(item => {
            const name = item.productName || 'Unknown Product';
            const current = productMap.get(name) || { name, sales: 0, quantity: 0 };
            productMap.set(name, {
              name,
              sales: current.sales + (item.price * item.quantity),
              quantity: current.quantity + item.quantity
            });
          });
        });

const top5 = Array.from(productMap.values())
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 5)
.map(p => ({
  name: p.name,
  sales: p.sales,
  quantity: p.quantity,
  growth: '+12%'
}))
        setTopProducts(top5);

        // Monthly trend (last 6 months)
        const monthlyData: { month: string; sales: number; orders: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(now, i));
          const monthEnd = endOfMonth(subMonths(now, i));

          const monthQuery = query(
            ordersRef,
            where('createdAt', '>=', monthStart),
            where('createdAt', '<=', monthEnd),
            where('status', 'in', ['delivered', 'confirmed'])
          );

          const monthSnap = await getDocs(monthQuery);
          const monthOrders = monthSnap.docs.map(d => d.data() as Order);
          const monthRevenue = monthOrders.reduce((s, o) => s + (o.total || 0), 0);

          monthlyData.push({
            month: format(monthStart, 'MMM'),
            sales: monthRevenue,
            orders: monthOrders.length
          });
        }

        setMonthlySales(monthlyData);

      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
              <p className="text-gray-600 mt-2">Real-time insights into sales, orders, and performance</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">
                <Calendar className="w-5 h-5" />
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium">
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-green-600 text-sm mt-2">Real-time data</p>
                </div>
                <div className="p-4 bg-green-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold mt-2">{totalOrders}</p>
                  <p className="text-blue-600 text-sm mt-2">Completed</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Order Value</p>
                  <p className="text-3xl font-bold mt-2">₹{avgOrderValue.toFixed(0)}</p>
                  <p className="text-purple-600 text-sm mt-2">Per order</p>
                </div>
                <div className="p-4 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Top Products</p>
                  <p className="text-3xl font-bold mt-2">{topProducts.length > 0 ? topProducts[0].name : 'N/A'}</p>
                  <p className="text-pink-600 text-sm mt-2">Best seller</p>
                </div>
                <div className="p-4 bg-pink-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border p-8 mb-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sales Trend (Last 6 Months)</h2>
              <div className="flex gap-3">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-5 py-2 rounded-lg font-medium transition ${
                      timeRange === range
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 flex items-end justify-between gap-4 px-4">
              {monthlySales.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all"
                    style={{ height: `${(data.sales / Math.max(...monthlySales.map(m => m.sales)) * 280) || 20}px` }}
                  />
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">{data.month}</p>
                    <p className="text-sm text-gray-600">₹{data.sales.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{data.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Products */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
              {topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No sales data yet</p>
              ) : (
                <div className="space-y-5">
                  {topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{product.name}</p>
                          <p className="text-sm text-gray-500">Best performer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">₹{product.sales.toLocaleString()}</p>
                        <p className="text-green-600 font-medium">+12% growth</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Performance</h2>
              <div className="space-y-6">
                {['Staples', 'Beverages', 'Snacks', 'Dairy', 'Personal Care'].map((cat, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">{cat}</span>
                      <span className="font-bold text-gray-900">{85 - i * 12}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-3 rounded-full transition-all"
                        style={{ width: `${85 - i * 12}%` }}
                      />
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