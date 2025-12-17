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
  serverTimestamp 
} from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';

// Create order
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, collections.orders), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Get all orders
export async function getOrders(status?: OrderStatus) {
  try {
    let q = query(
      collection(db, collections.orders),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deliveredAt: data.deliveredAt?.toDate(),
      } as Order);
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

// Update order status
export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const docRef = doc(db, collections.orders, id);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    }
    
    await updateDoc(docRef, updateData);
    return { id, status };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Get today's orders
export async function getTodaysOrders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, collections.orders),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting today\'s orders:', error);
    throw error;
  }
}