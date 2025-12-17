'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Products', icon: Package, href: '/dashboard/products' },
  { name: 'Orders', icon: ShoppingCart, href: '/dashboard/orders' },
  { name: 'Customers', icon: Users, href: '/dashboard/customers' },
  { name: 'Delivery', icon: Truck, href: '/dashboard/delivery' },
  { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static w-64 bg-white border-r min-h-screen p-4 transition-transform z-40
      `}>
        {/* Logo */}
        <div className="mb-8 p-2">
          <h1 className="text-2xl font-bold text-green-600">Sure Wholesaler</h1>
          <p className="text-sm text-gray-500">Grocery Admin</p>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button className="flex items-center gap-3 p-3 mt-8 w-full text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <div className="lg:hidden">
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-green-600">A</span>
                </div>
                <div>
                  <p className="font-medium">Admin User</p>
                  <p className="text-sm text-gray-500">admin@test.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}