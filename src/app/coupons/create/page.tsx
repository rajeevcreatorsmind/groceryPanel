'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, ArrowLeft, Calendar, Users, IndianRupee, Percent, Clock, CheckCircle2, Loader2, AlertCircle, Tag, Copy } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateCouponPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    couponCode: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    perUserLimit: '',
    startDate: '',
    expiryDate: '',
    description: '',
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, couponCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLoading) return;

    if (!formData.couponCode.trim()) { setError('Coupon code is required'); return; }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) { setError('Valid discount value is required'); return; }
    if (!formData.maxUses || Number(formData.maxUses) <= 0) { setError('Maximum uses must be at least 1'); return; }
    if (!formData.expiryDate) { setError('Expiry date is required'); return; }

    setIsLoading(true);

    try {
      const couponData = {
        code: formData.couponCode.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxUses: Number(formData.maxUses),
        perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : null,
        currentUses: 0,
        startDate: formData.startDate || null,
        expiryDate: formData.expiryDate,
        description: formData.description.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'coupons'), couponData);
      setSuccess(true);
      setTimeout(() => router.push('/coupons'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const discountDisplay = formData.discountType === 'percentage'
    ? `${formData.discountValue || '0'}%`
    : `₹${formData.discountValue || '0'}`;

return (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />

    {/* Main Content - Full width after sidebar */}
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {/* Centered container - full width on small screens, max width on large */}
        <div className="max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/coupons')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Coupons
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Coupon</h1>
            <p className="text-gray-600 mt-1">Fill in the details to create a new discount</p>
          </div>

          {/* Success / Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Coupon created successfully!</p>
                <p className="text-sm">Redirecting to coupons list...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Main Grid: Form (2/3) + Preview (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Coupon Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => updateField('couponCode', e.target.value.toUpperCase())}
                      placeholder="WELCOME20"
                      className="flex-1 px-5 py-4 text-xl font-mono uppercase tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      maxLength={20}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      disabled={isLoading}
                      className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Discount Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['percentage', 'fixed'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          disabled={isLoading}
                          onClick={() => updateField('discountType', type)}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            formData.discountType === type
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-3">
                            {type === 'percentage' ? (
                              <Percent className="w-9 h-9 text-purple-600" />
                            ) : (
                              <IndianRupee className="w-9 h-9 text-purple-600" />
                            )}
                            <p className="font-medium capitalize">
                              {type === 'fixed' ? 'Fixed' : 'Percentage'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Discount Value <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => updateField('discountValue', e.target.value)}
                        placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                        className="w-full px-5 py-5 pl-16 pr-14 text-3xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        min="1"
                        disabled={isLoading}
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2">
                        {formData.discountType === 'percentage' ? (
                          <Percent className="w-8 h-8 text-gray-500" />
                        ) : (
                          <IndianRupee className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      {formData.discountType === 'percentage' && (
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-500">%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Restrictions */}
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Order Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="number"
                        value={formData.minOrderAmount}
                        onChange={(e) => updateField('minOrderAmount', e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Uses <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => updateField('maxUses', e.target.value)}
                        placeholder="500"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Per Customer</label>
                    <input
                      type="number"
                      value={formData.perUserLimit}
                      onChange={(e) => updateField('perUserLimit', e.target.value)}
                      placeholder="Unlimited"
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => updateField('expiryDate', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    placeholder="e.g. Valid on orders above ₹999. One-time use only."
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                    disabled={isLoading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/coupons')}
                    disabled={isLoading}
                    className="px-8 py-3.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || success}
                    className="px-10 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl font-medium flex items-center gap-3 transition"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Created!
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Coupon
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h3 className="text-xl font-bold text-center mb-5 text-gray-800">Live Preview</h3>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-7 text-white shadow-xl">
                  <div className="flex justify-between items-center mb-5">
                    <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">Active</span>
                    <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <h2 className="text-4xl font-black mb-3 tracking-widest text-center">
                    {formData.couponCode || 'YOURCODE'}
                  </h2>
                  <p className="text-center text-sm opacity-90 mb-8">Use this code at checkout</p>

                  <div className="bg-white rounded-xl p-6 text-center">
                    <p className="text-5xl font-black text-purple-600 mb-3">
                      {discountDisplay} OFF
                    </p>
                    <p className="font-semibold text-gray-800">
                      {formData.discountType === 'percentage' ? 'Percentage Discount' : 'Flat Discount'}
                    </p>
                    {formData.minOrderAmount && Number(formData.minOrderAmount) > 0 && (
                      <p className="text-sm text-gray-600 mt-3">
                        Min order: ₹{formData.minOrderAmount}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-5">
                      Expires: {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  
);
}