// ==================== GROCERY TYPES ====================

export type UnitType = 'pack' | 'kg' | 'gram' | 'piece' | 'liter';
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
export type OrderType = 'delivery' | 'pickup' | 'instore';
export type PaymentMethod = 'cod' | 'card' | 'upi' | 'wallet';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  currentStock: number;
  minStockAlert: number;
  unit: UnitType;
  expiryDate?: string;
  batchNumber?: string;
  supplier: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  deliveryAddress?: string;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
}

// ==================== MOCK DATA ====================

export const mockProducts: Product[] = [
  { id: '1', sku: 'MILK-001', name: 'Amul Milk 1L', category: 'Dairy', price: 65, costPrice: 55, currentStock: 45, minStockAlert: 10, unit: 'pack', expiryDate: '2024-01-20', supplier: 'Amul', isActive: true },
  { id: '2', sku: 'RICE-001', name: 'Basmati Rice 5kg', category: 'Grains', price: 450, costPrice: 400, currentStock: 23, minStockAlert: 5, unit: 'pack', expiryDate: '2024-12-31', supplier: 'Fortune', isActive: true },
  { id: '3', sku: 'EGG-001', name: 'Fresh Eggs (Dozen)', category: 'Dairy', price: 90, costPrice: 75, currentStock: 120, minStockAlert: 20, unit: 'pack', expiryDate: '2024-01-25', supplier: 'Local Farm', isActive: true },
  { id: '4', sku: 'BRD-001', name: 'Bread White', category: 'Bakery', price: 40, costPrice: 30, currentStock: 5, minStockAlert: 10, unit: 'pack', expiryDate: '2024-01-18', supplier: 'Britannia', isActive: true },
  { id: '5', sku: 'POT-001', name: 'Potatoes', category: 'Vegetables', price: 30, costPrice: 20, currentStock: 150, minStockAlert: 50, unit: 'kg', expiryDate: '2024-01-30', supplier: 'Local Farm', isActive: true },
  { id: '6', sku: 'COKE-001', name: 'Coca-Cola 2L', category: 'Beverages', price: 90, costPrice: 70, currentStock: 0, minStockAlert: 20, unit: 'bottle', expiryDate: '2024-06-30', supplier: 'Coca-Cola', isActive: true },
  { id: '7', sku: 'CHIPS-001', name: 'Lays Potato Chips', category: 'Snacks', price: 20, costPrice: 15, currentStock: 8, minStockAlert: 10, unit: 'pack', expiryDate: '2024-03-15', supplier: 'PepsiCo', isActive: true },
  { id: '8', sku: 'ONN-001', name: 'Onions', category: 'Vegetables', price: 40, costPrice: 25, currentStock: 200, minStockAlert: 50, unit: 'kg', expiryDate: '2024-02-10', supplier: 'Local Farm', isActive: true },
];

// FIX: ADD THIS mockOrders EXPORT
export const mockOrders: Order[] = [
  { 
    id: '1', 
    orderNo: 'ORD-001', 
    customerName: 'Rahul Sharma', 
    customerPhone: '+919876543210', 
    items: [{ productId: '1', name: 'Amul Milk 1L', quantity: 2, price: 65 }], 
    total: 130, 
    status: 'delivered', 
    orderType: 'delivery', 
    createdAt: new Date() 
  },
  { 
    id: '2', 
    orderNo: 'ORD-002', 
    customerName: 'Priya Patel', 
    customerPhone: '+919876543211', 
    items: [{ productId: '2', name: 'Basmati Rice 5kg', quantity: 1, price: 450 }], 
    total: 450, 
    status: 'pending', 
    orderType: 'pickup', 
    createdAt: new Date() 
  },
  { 
    id: '3', 
    orderNo: 'ORD-003', 
    customerName: 'Amit Kumar', 
    customerPhone: '+919876543212', 
    items: [
      { productId: '3', name: 'Fresh Eggs (Dozen)', quantity: 1, price: 90 },
      { productId: '7', name: 'Lays Potato Chips', quantity: 2, price: 20 }
    ], 
    total: 130, 
    status: 'packed', 
    orderType: 'delivery', 
    deliveryAddress: '123 MG Road, Mumbai',
    createdAt: new Date(Date.now() - 86400000) 
  },
  { 
    id: '4', 
    orderNo: 'ORD-004', 
    customerName: 'Neha Singh', 
    customerPhone: '+919876543213', 
    items: [
      { productId: '2', name: 'Basmati Rice 5kg', quantity: 2, price: 450 },
      { productId: '5', name: 'Potatoes', quantity: 3, price: 30 }
    ], 
    total: 990, 
    status: 'confirmed', 
    orderType: 'delivery', 
    deliveryAddress: '45 Park Street, Delhi',
    createdAt: new Date(Date.now() - 172800000) 
  },
  { 
    id: '5', 
    orderNo: 'ORD-005', 
    customerName: 'Raj Patel', 
    customerPhone: '+919876543214', 
    items: [
      { productId: '1', name: 'Amul Milk 1L', quantity: 4, price: 65 },
      { productId: '8', name: 'Onions', quantity: 2, price: 40 }
    ], 
    total: 340, 
    status: 'pending', 
    orderType: 'pickup', 
    createdAt: new Date(Date.now() - 3600000) 
  },
];

// FIX: ALSO ADD allOrders FOR ORDERS PAGE
export const allOrders: Order[] = [
  ...mockOrders,
  { 
    id: '6', 
    orderNo: 'ORD-006', 
    customerName: 'New Customer', 
    customerPhone: '+919876543215', 
    items: [
      { productId: '1', name: 'Amul Milk 1L', quantity: 2, price: 65 },
      { productId: '3', name: 'Fresh Eggs (Dozen)', quantity: 1, price: 90 },
      { productId: '4', name: 'Bread White', quantity: 3, price: 40 }
    ], 
    total: 340, 
    status: 'delivered', 
    orderType: 'delivery', 
    deliveryAddress: '78 Gandhi Nagar, Bangalore',
    createdAt: new Date(Date.now() - 259200000) 
  },
];

export const mockCustomers: Customer[] = [
  { id: '1', phone: '+919876543210', name: 'Rahul Sharma', address: '123 MG Road, Mumbai', totalOrders: 12, totalSpent: 12500 },
  { id: '2', phone: '+919876543211', name: 'Priya Patel', address: '45 Park Street, Delhi', totalOrders: 8, totalSpent: 8900 },
  { id: '3', phone: '+919876543212', name: 'Amit Kumar', address: '78 Gandhi Nagar, Bangalore', totalOrders: 5, totalSpent: 3400 },
  { id: '4', phone: '+919876543213', name: 'Neha Singh', address: '90 Lake View, Kolkata', totalOrders: 15, totalSpent: 21000 },
];