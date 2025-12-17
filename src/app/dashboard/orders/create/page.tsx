'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Search, User } from 'lucide-react';
import { mockProducts } from '@/types';

export default function CreateOrderPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [cart, setCart] = useState<Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Mock customers
  const customers = [
    { id: '1', name: 'Rahul Sharma', phone: '+919876543210', address: '123 MG Road, Mumbai' },
    { id: '2', name: 'Priya Patel', phone: '+919876543211', address: '45 Park Street, Delhi' },
    { id: '3', name: 'Amit Kumar', phone: '+919876543212', address: '78 Gandhi Nagar, Bangalore' },
    { id: '4', name: 'Neha Singh', phone: '+919876543213', address: '90 Lake View, Kolkata' },
  ];

  // Filter products
  const filteredProducts = mockProducts.filter(p =>
    p.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = orderType === 'delivery' ? 30 : 0;
  const tax = cartTotal * 0.05;
  const grandTotal = cartTotal + deliveryCharge + tax;

  const handleSubmit = () => {
    // TODO: Save order to Firebase
    alert('Order created successfully!');
    router.push('/dashboard/orders');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600">Process a new customer order</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === stepNumber
                  ? 'bg-green-600 text-white'
                  : step > stepNumber
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-16 h-1 ${
                  step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-6">1. Select Customer</h2>
            
            {/* Search Customer */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by customer name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setDeliveryAddress(customer.address);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedCustomer?.id === customer.id ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                      <div className="text-xs text-gray-400 mt-1">{customer.address}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New Customer Option */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Or create new customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Customer Name" className="p-3 border rounded-lg" />
                <input type="tel" placeholder="Phone Number" className="p-3 border rounded-lg" />
                <textarea 
                  placeholder="Delivery Address" 
                  rows={2}
                  className="p-3 border rounded-lg md:col-span-2"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedCustomer && !deliveryAddress}
                className={`px-6 py-3 rounded-lg font-medium ${
                  selectedCustomer || deliveryAddress
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next → Add Products
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products List */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg border mb-6">
                <h2 className="text-lg font-bold mb-6">2. Add Products</h2>
                
                {/* Search Products */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                        <div className="font-bold">₹{product.price}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          Stock: <span className={product.currentStock < product.minStockAlert ? 'text-red-600' : 'text-green-600'}>
                            {product.currentStock}
                          </span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-bold mb-4">Order Cart</h2>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🛒</div>
                    <p>No items in cart</p>
                    <p className="text-sm">Add products from the list</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.productId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="font-bold">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-6 h-6 flex items-center justify-center border rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-6 h-6 flex items-center justify-center border rounded"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span>₹{deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                      <span>Total</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                  >
                    Next → Review Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-bold mb-6">3. Review & Place Order</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Details */}
              <div>
                <h3 className="font-bold mb-4">Order Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-medium">{selectedCustomer?.name || 'New Customer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">{selectedCustomer?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Type</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrderType('delivery')}
                        className={`px-3 py-1 rounded text-sm ${
                          orderType === 'delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Delivery
                      </button>
                      <button
                        onClick={() => setOrderType('pickup')}
                        className={`px-3 py-1 rounded text-sm ${
                          orderType === 'pickup'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Pickup
                      </button>
                    </div>
                  </div>
                  {orderType === 'delivery' && (
                    <div>
                      <div className="text-gray-600 mb-1">Delivery Address</div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {deliveryAddress}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h3 className="font-bold mb-4">Items ({cart.length})</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between">
                      <span>{item.quantity} × {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Includes delivery charge and taxes
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                ← Back to Products
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Save as draft
                    alert('Order saved as draft!');
                    router.push('/dashboard/orders');
                  }}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}