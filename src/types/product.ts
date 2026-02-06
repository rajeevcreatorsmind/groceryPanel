import { ReactNode } from "react";

export interface Product {
  minStockAlert: number;
  currentStock: number;
  price: ReactNode;
  id?: string;
  name: string;
  sku?: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;

  brandId?: string | null;
  brandName?: string | null;
  
  // Optional single quantity (if you still use it in some cases)
  quantity?: {
    value: string;
    unit: string;
  };

  // ───────────────────────────────────────
  // Main change: packVariants array instead of single values
  packVariants: PackVariant[];

  // Shared / root-level fields
  description?: string | null;
  supplier?: string | null;
  imageUrls?: string[] | null;
  isActive: boolean;
  isStoryItem?: boolean;

  // Offers
  offerType?: 
    | 'None'
    | 'Buy One Get One Free'
    | 'Buy X Get Y Free'
    | 'Buy X Get Y Discount'
    | 'Buy X Product Get Y Product Free'
    | null;
  offerDetails?: {
    buyQty?: number;
    getQty?: number;
    discountPercent?: number;
    buyProductId?: string;
    getProductId?: string;
  } | null;

  createdAt?: any;
  updatedAt?: any;
}

// ───────────────────────────────────────
// New interface for each variant
export interface PackVariant {
  packSize: number;               // e.g. 6, 12, 500
  mrp: number;                    // usually higher or equal to price
  price: number;                  // selling price
  stock: number;
  minStockAlert: number;
  expiryDate?: string | null;     // "YYYY-MM-DD"
  isActive: boolean;
}

// Keep your existing Category interface
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  parentName?: string | null;
  status: 'active' | 'inactive';
  imageUrl?: string;
  sortOrder?: number;
  productCount?: number;
  createdAt?: any;
  updatedAt?: any;
  children?: Category[];
  level?: number;
}

// Optional types (unchanged)
export interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

export interface BulkProductUpdate {
  ids: string[];
  updateData: Partial<Product>;
}