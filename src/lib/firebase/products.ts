import { db, collections } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { Product } from '@/types';

// Create product
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, collections.products), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Get all products
export async function getProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, collections.products));
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// Get product by ID
export async function getProductById(id: string) {
  try {
    const docRef = doc(db, collections.products, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

// Update product
export async function updateProduct(id: string, productData: Partial<Product>) {
  try {
    const docRef = doc(db, collections.products, id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
    return { id, ...productData };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete product
export async function deleteProduct(id: string) {
  try {
    await deleteDoc(doc(db, collections.products, id));
    return { id };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Get low stock products
export async function getLowStockProducts() {
  try {
    const q = query(
      collection(db, collections.products),
      where('currentStock', '<', where('minStockAlert', '>', 0))
    );
    
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
}