'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  BarChart3,
  DollarSign,
  Package,
  Images,
  Tag,
  MessageSquare,
  FolderTree,
  UserCircle,
  LogOut,
  Bell,
  ShoppingBag,
  Truck,
  Van,
  AlertTriangle, // Added for Low Stock card
} from '@/components/icons';

import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  // Real-time low stock count from Firebase
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));

      const lowStock = productsData.filter(
        (p) =>
          p.currentStock > 0 && // Not completely out
          p.currentStock < p.minStockAlert
      ).length;

      setLowStockCount(lowStock);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  const quickLinks = [
    { title: 'Monthly Report', icon: BarChart3, link: '/reports', color: 'from-blue-500 to-cyan-500' },
    { title: 'Payments', icon: DollarSign, link: '/payments', color: 'from-green-500 to-emerald-500' },
    { title: 'Products', icon: Package, link: '/products', color: 'from-purple-500 to-pink-500' },
    { title: 'Images Sliders', icon: Images, link: '/sliders', color: 'from-yellow-500 to-orange-500' },
    { title: 'Coupons', icon: Tag, link: '/coupons', color: 'from-red-500 to-pink-500' },
    { title: 'Feed Back', icon: MessageSquare, link: '/feedback', color: 'from-indigo-500 to-blue-500' },
    { title: 'Delivery Dashboard', icon: Van, link: '/deliverydashboard', color: 'from-green-500 to-emerald-500' },
    { title: 'Category', icon: FolderTree, link: '/categories', color: 'from-teal-500 to-green-500' },

    // Low Stock Alerts Card
    {
      title: 'Low Stock Alerts',
      icon: AlertTriangle,
      link: '/low-stock',
      color: 'from-orange-500 to-red-500',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },

    { title: 'My Account', icon: UserCircle, link: '/myaccount', color: 'from-gray-500 to-slate-500' },
    { title: 'All Delivery Boys', icon: Truck, link: '/deliveryBoy', color: 'from-amber-500 to-yellow-500' },
    { title: 'Logout', icon: LogOut, action: handleLogout, color: 'from-rose-500 to-red-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Header with Notification Bell */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Notification Bell - Links to Low Stock Page */}
              <Link href="/low-stock" className="relative">
                <button className="relative p-3 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <Bell className="w-7 h-7 text-gray-600 cursor-pointer" />
                  {lowStockCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              </Link>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-600">Here's what's happening with your store today.</p>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 lg:gap-8">
            {quickLinks.map((item, i) => {
              const Icon = item.icon;

              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-green-600 to-teal-600',
                'from-orange-500 to-red-500',
                'from-purple-600 to-pink-600',
                'from-yellow-500 to-amber-500',
                'from-indigo-500 to-purple-500',
                'from-teal-500 to-emerald-500',
                'from-rose-500 to-pink-500',
                'from-cyan-400 to-blue-600',
                'from-lime-500 to-green-600',
                'from-orange-500 to-red-600', // Extra for low stock
                'from-gray-500 to-slate-600',
              ];

              const bgColor = `bg-gradient-to-br ${gradients[i % gradients.length]}`;

              const content = (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 group relative h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className={`p-3 sm:p-4 ${bgColor} rounded-2xl text-white group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      Click to manage
                      <span className="group-hover:translate-x-2 transition-transform inline-block">→</span>
                    </p>
                  </div>
                </div>
              );

              return item.action ? (
                <button key={i} onClick={item.action} className="text-left w-full">
                  {content}
                </button>
              ) : (
                <Link key={i} href={item.link} className="block h-full">
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}