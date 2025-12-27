'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  Store,
  CreditCard,
  Globe,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  Package,
  Clock,
  Truck
} from '@/components/icons';

export default function GrocerySettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    storeName: 'FreshMart Grocery',
    storeEmail: 'support@freshmart.com',
    supportPhone: '+91 98765 43210',
    currency: '₹',
    gstPercentage: 5,
    bagCharge: 10,
    freeDeliveryAbove: 499,
    minOrderAmount: 199,
    deliverySlotsEnabled: true,
    morningSlotStart: '07:00',
    morningSlotEnd: '12:00',
    eveningSlotStart: '16:00',
    eveningSlotEnd: '21:00',
    maxOrdersPerSlot: 50,
    weightUnit: 'kg',
    maintenanceMode: false,
  });

  // Fetch settings from Firebase on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'configurations', 'grocerySettings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'configurations', 'grocerySettings'), {
        ...settings,
        updatedAt: new Date(),
      }, { merge: true });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'charges', label: 'Charges & Tax', icon: CreditCard },
    { id: 'delivery', label: 'Delivery Rules', icon: Truck },
    { id: 'slots', label: 'Delivery Slots', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading grocery settings...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Grocery Settings</h1>
            <p className="text-gray-600 mt-2">Manage your grocery store configuration and delivery preferences</p>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-medium">Settings saved successfully!</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-6">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                {/* General / Store Info */}
                {(activeTab === 'general' || activeTab === 'store') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Store Information</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                        <input
                          type="text"
                          name="storeName"
                          value={settings.storeName}
                          onChange={handleChange}
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                        <input
                          type="email"
                          name="storeEmail"
                          value={settings.storeEmail}
                          onChange={handleChange}
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                        <input
                          type="tel"
                          name="supportPhone"
                          value={settings.supportPhone}
                          onChange={handleChange}
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                        <select
                          name="currency"
                          value={settings.currency}
                          onChange={handleChange}
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="₹">Indian Rupee (₹)</option>
                          <option value="$">US Dollar ($)</option>
                          <option value="€">Euro (€)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charges & Tax */}
                {activeTab === 'charges' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Charges & Tax</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Percentage (%)</label>
                        <input
                          type="number"
                          name="gstPercentage"
                          value={settings.gstPercentage}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bag/Packaging Charge (₹)</label>
                        <input
                          type="number"
                          name="bagCharge"
                          value={settings.bagCharge}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Above (₹)</label>
                        <input
                          type="number"
                          name="freeDeliveryAbove"
                          value={settings.freeDeliveryAbove}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Delivery Rules */}
                {activeTab === 'delivery' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Rules</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount (₹)</label>
                        <input
                          type="number"
                          name="minOrderAmount"
                          value={settings.minOrderAmount}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Weight Unit</label>
                        <select
                          name="weightUnit"
                          value={settings.weightUnit}
                          onChange={handleChange}
                          className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Gram (g)</option>
                          <option value="lb">Pound (lb)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={handleChange}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Maintenance Mode (App will be temporarily unavailable)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Slots */}
                {activeTab === 'slots' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Time Slots</h2>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <input
                          type="checkbox"
                          name="deliverySlotsEnabled"
                          checked={settings.deliverySlotsEnabled}
                          onChange={handleChange}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <label className="text-sm font-medium text-gray-700">Enable Delivery Slot Booking</label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Morning Slot Start</label>
                          <input
                            type="time"
                            name="morningSlotStart"
                            value={settings.morningSlotStart}
                            onChange={handleChange}
                            disabled={!settings.deliverySlotsEnabled}
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Morning Slot End</label>
                          <input
                            type="time"
                            name="morningSlotEnd"
                            value={settings.morningSlotEnd}
                            onChange={handleChange}
                            disabled={!settings.deliverySlotsEnabled}
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Evening Slot Start</label>
                          <input
                            type="time"
                            name="eveningSlotStart"
                            value={settings.eveningSlotStart}
                            onChange={handleChange}
                            disabled={!settings.deliverySlotsEnabled}
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Evening Slot End</label>
                          <input
                            type="time"
                            name="eveningSlotEnd"
                            value={settings.eveningSlotEnd}
                            onChange={handleChange}
                            disabled={!settings.deliverySlotsEnabled}
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Orders Per Slot</label>
                          <input
                            type="number"
                            name="maxOrdersPerSlot"
                            value={settings.maxOrdersPerSlot}
                            onChange={handleChange}
                            min="1"
                            disabled={!settings.deliverySlotsEnabled}
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder Tabs */}
                {['notifications', 'security'].includes(activeTab) && (
                  <div className="text-center py-12">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4" />
                    <p className="text-gray-500">This section is under development</p>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end mt-10 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-xl font-medium flex items-center gap-3 transition-all disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}