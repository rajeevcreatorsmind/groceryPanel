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
} from '@/components/icons';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unreadNotifications] = useState(3);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

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
    { title: 'Category', icon: FolderTree, link: '/categories', color: 'from-teal-500 to-green-500' },
    { title: 'All Delivery Boys', icon: Truck, link: '/delivery-boys', color: 'from-amber-500 to-yellow-500'},
    { title: 'My Account', icon: UserCircle, link: '/account', color: 'from-gray-500 to-slate-500', badge: unreadNotifications },
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

      {/* Main Content - No left margin, full width with safe padding */}
      <main className="flex-1 min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

              <button className="relative p-3 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <Bell className="w-7 h-7 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>



          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 1xl:grid-cols-4 gap-6 lg:gap-8">
            {quickLinks.map((item, i) => {
              const Icon = item.icon;

              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-green-500 to-emerald-500',
                'from-purple-500 to-pink-500',
                'from-yellow-500 to-orange-500',
                'from-red-500 to-pink-500',
                'from-indigo-500 to-blue-500',
                'from-teal-500 to-green-500',
                'from-amber-500 to-yellow-500',
                'from-gray-500 to-slate-500',
                'from-rose-500 to-red-500',
              ];

              const bgColor = `bg-gradient-to-br ${gradients[i % gradients.length]}`;

              const content = (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 group relative h-full flex flex-col">
                  {/* {item.admin && (
                    <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Admin
                    </span>
                  )} */}

                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className={`p-3 sm:p-4 ${bgColor} rounded-2xl text-white group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
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