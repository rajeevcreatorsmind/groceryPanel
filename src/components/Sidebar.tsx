'use client';

import React from 'react';
import Link from 'next/link';
import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaTag,
  FaChartLine,
  FaImages,
  FaCommentAlt,
  FaLayerGroup,
  FaTruck,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaShoppingBag,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
  FaStore,
  FaMotorcycle,
  FaTachometerAlt,
} from 'react-icons/fa';

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  href: string;
  isCollapsed: boolean;
  isActive: boolean;
  isLogout?: boolean;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Important: Update body data attribute for main content margin
  useEffect(() => {
    document.body.dataset.sidebar = isCollapsed ? 'collapsed' : 'expanded';
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const sidebarWidth = isCollapsed ? '80px' : '260px';

  // Define icons with fixed size and inherit color
  const menuItems = [
    { icon: <FaHome className="w-5 h-5" />, label: 'Home', href: '/' },
    { icon: <FaTachometerAlt className="w-5 h-5" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <FaBoxOpen className="w-5 h-5" />, label: 'Products', href: '/products' },
    { icon: <FaShoppingCart className="w-5 h-5" />, label: 'Orders', href: '/orders' },
    { icon: <FaUsers className="w-5 h-5" />, label: 'Customers', href: '/customers' },
    { icon: <FaTag className="w-5 h-5" />, label: 'Coupons', href: '/coupons' },
    { icon: <FaChartLine className="w-5 h-5" />, label: 'Reports', href: '/reports' },
    { icon: <FaImages className="w-5 h-5" />, label: 'Image Sliders', href: '/sliders' },
    { icon: <FaCommentAlt className="w-5 h-5" />, label: 'Feedback', href: '/feedback' },
    { icon: <FaLayerGroup className="w-5 h-5" />, label: 'Categories', href: '/categories' },
    { icon: <FaMotorcycle className="w-5 h-5" />, label: 'Delivery Boys', href: '/delivery-boys' },
    { icon: <FaUserCircle className="w-5 h-5" />, label: 'My Account', href: '/account' },
    { icon: <FaCog className="w-5 h-5" />, label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <div
        className={`bg-white border-r shadow-sm flex flex-col fixed md:static top-0 left-0 h-screen z-40 transition-all duration-300 ${
          isMobile && isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: sidebarWidth }}
      >
        {/* Toggle Button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-4 top-20 z-50 w-10 h-10 bg-white border-2 border-gray-300 rounded-full shadow-lg items-center justify-center hover:bg-purple-50"
          >
            {isCollapsed ? <FaChevronRight className="text-gray-600" /> : <FaChevronLeft className="text-gray-600" />}
          </button>
        )}

        {/* Logo */}
        <div className="p-6 border-b bg-gradient-to-br from-purple-600 to-pink-600 text-white text-center">
          {isCollapsed ? (
            <FaShoppingBag className="w-10 h-10 mx-auto" />
          ) : (
            <>
              <h1 className="text-2xl font-bold">Sure Wholesaler</h1>
              <p className="text-sm opacity-90 mt-1">Admin Panel</p>
            </>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t p-4">
          <SidebarLink
            icon={<FaSignOutAlt className="w-5 h-5" />}
            label="Logout"
            href="/logout"
            isCollapsed={isCollapsed}
            isActive={false}
            isLogout={true}
          />
          {!isCollapsed && (
            <div className="mt-6 pt-4 border-t flex items-center text-gray-500 text-sm">
              <FaShieldAlt className="mr-2" />
              <span>Secure Admin Panel</span>
            </div>
          )}
          {isCollapsed && <FaShieldAlt className="w-5 h-5 text-gray-500 mx-auto mt-4" />}
        </div>
      </div>

      {/* Mobile Overlay & Button */}
      {isMobile && !isCollapsed && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black/50 z-30 md:hidden" />
      )}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <FaBars className="w-6 h-6 text-gray-700" />
        </button>
      )}
    </>
  );
}

function SidebarLink({ icon, label, href, isCollapsed, isActive, isLogout = false }: SidebarLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const linkClasses = `
    group flex items-center rounded-xl px-4 py-3 transition-all duration-200 font-bold cursor-pointer select-none
    ${isActive ? 'bg-purple-100 text-purple-700 shadow-md' : 'text-gray-700 hover:bg-gray-100'}
    ${isLogout ? '!text-red-600 hover:bg-red-50 hover:text-red-700' : 'hover:text-purple-700'}
  `;

  const content = (
    <div
      className={linkClasses}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`inline-block transition-transform duration-200 ${!isActive && !isLogout ? 'group-hover:scale-110' : ''}`}>
        {icon}
      </span>
      {!isCollapsed && <span className="ml-4 text-base">{label}</span>}
    </div>
  );

  return (
    <div className="relative">
      {isLogout ? (
        <button
          onClick={() => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/login';
          }}
          className="w-full text-left"
        >
          {content}
        </button>
      ) : (
        <Link href={href} className="block">
          {content}
        </Link>
      )}

      {/* Tooltip */}
      {isCollapsed && showTooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-xl z-50 whitespace-nowrap pointer-events-none">
          {label}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 border-8 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );
}