'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Share2, MessageSquare, CheckCircle, Package, Truck, Home } from 'lucide-react';
// import { allOrders } from './page'; // Import from orders listing
import { allOrders } from '@/types';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Find the order - in real app, fetch from API
  const order = allOrders.find(o => o.id === orderId) || allOrders[0];

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="text-green-600 hover:underline"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const orderItems = order.items || [];
  const orderTotal = order.total || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNo}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              <span>•</span>
              <span>{order.customerName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Printer size={20} />
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-50">
            <Share2 size={20} />
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Timeline */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-6">Order Status</h2>
            <div className="space-y-6">
              {[
                { status: 'Order Placed', time: new Date(order.createdAt).toLocaleTimeString(), active: true },
                { status: 'Order Confirmed', time: order.status !== 'pending' ? '10:30 AM' : 'Pending', active: order.status !== 'pending' },
                { status: 'Items Packed', time: order.status === 'packed' || order.status === 'delivered' ? '11:15 AM' : 'Pending', active: order.status === 'packed' || order.status === 'delivered' },
                { status: 'Out for Delivery', time: order.status === 'delivered' ? '12:00 PM' : 'Pending', active: order.status === 'delivered' },
                { status: 'Delivered', time: order.status === 'delivered' ? '1:30 PM' : 'Pending', active: order.status === 'delivered' },
              ].map((step, index) => (
                <div key={step.status} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    step.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.active ? <CheckCircle size={16} /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.status}</div>
                    <div className="text-sm text-gray-500">{step.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-6">Order Items</h2>
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📦</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: PROD-{index + 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{item.price}</div>
                    <div className="text-gray-500">Qty: {item.quantity}</div>
                    <div className="font-medium">₹{item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-8 border-t pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orderTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹{order.deliveryType === 'delivery' ? '30' : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>₹{Math.round(orderTotal * 0.05)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total Amount</span>
                  <span>₹{orderTotal + (order.deliveryType === 'delivery' ? 30 : 0) + Math.round(orderTotal * 0.05)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Actions */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-6">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{order.customerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{order.customerPhone}</div>
              </div>
              {order.deliveryAddress && (
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                    <Home size={16} />
                    Delivery Address
                  </div>
                  <div className="text-sm bg-gray-50 p-3 rounded-lg">
                    {order.deliveryAddress}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Delivery Type</div>
                <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                  order.deliveryType === 'delivery' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {order.deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                </div>
              </div>
            </div>
          </div>

          {/* Order Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <MessageSquare size={18} />
                Message Customer
              </button>
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                <Package size={18} />
                Mark as Packed
              </button>
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                <Truck size={18} />
                Assign Delivery
              </button>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button className="w-full p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-bold mb-6">Order Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">Cash on Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  order.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'delivered' ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}