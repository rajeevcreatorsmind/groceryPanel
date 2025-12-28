// types/product.ts 

export interface Product {
  id?: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  quantity?: {  
    value: string;
    unit: string;
  };
  mrp?: number; 
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  currentStock: number;
  minStockAlert: number;
  expiryDate?: string;
  supplier?: string;
  description?: string;
  imageUrls?: string[];
  isActive: boolean;
  offerType?: 'None' | 'Buy One Get One Free' | 'Buy X Get Y Free' | 'Buy X Get Y Discount' | 'Buy X Product Get Y Product Free';
  offerDetails?: {
    buyQty?: number;
    getQty?: number;
    discountPercent?: number;
    buyProductId?: string;
    getProductId?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  sortOrder?: number;
  productCount?: number;
  createdAt?: any;
  updatedAt?: any;
  // For hierarchical categories
  children?: Category[];
  level?: number;
}

// Optional: For category management
export interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
}

// Optional: For bulk operations
export interface BulkProductUpdate {
  ids: string[];
  updateData: Partial<Product>;
}