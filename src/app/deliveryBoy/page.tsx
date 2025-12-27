'use client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/delivery/StatsCards';
import DeliveryBoysTable from '@/components/delivery/DeliveryBoysTable';
import ViewModal from '@/components/delivery/ViewModal';
import EditModal from '@/components/delivery/EditModal';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { DeliveryBoy } from '@/types/delivery';
import { Search, Filter,Truck } from 'lucide-react';
import { Send  } from '@/components/icons';

export default function DeliveryBoyPage() {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [filteredBoys, setFilteredBoys] = useState<DeliveryBoy[]>([]);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  
  // Modal States
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoy | null>(null);

  useEffect(() => {
    loadDeliveryBoys();
  }, []);

  useEffect(() => {
    const filtered = deliveryBoys.filter(boy => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        `${boy.firstName} ${boy.lastName}`.toLowerCase().includes(searchLower) ||
        boy.phoneNumber.toLowerCase().includes(searchLower) ||
        boy.email.toLowerCase().includes(searchLower) ||
        (boy.bikeNumber || '').toLowerCase().includes(searchLower);

      const matchesTab = activeTab === 'approved' 
        ? boy.approved && boy.status !== 'Deleted' && boy.status !== 'Rejected'
        : !boy.approved && boy.status === 'Pending';

      return matchesSearch && matchesTab;
    });
    setFilteredBoys(filtered);
  }, [deliveryBoys, activeTab, searchTerm]);

  const loadDeliveryBoys = async () => {
    try {
      const snap = await getDocs(collection(db, 'deliveryBoys'));
      const boys = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryBoy));
      setDeliveryBoys(boys);
    } catch (err) {
      console.error('Error loading delivery boys:', err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (boy: DeliveryBoy) => {
    setSelectedBoy(boy);
    setShowViewModal(true);
  };

  const handleEdit = (boy: DeliveryBoy) => {
    setSelectedBoy(boy);
    setShowEditModal(true);
  };

  const handleApprove = async (boyId: string) => {
    if (!confirm('Approve this delivery boy?')) return;
    try {
      await updateDoc(doc(db, 'deliveryBoys', boyId), {
        approved: true,
        status: 'Active',
        canLogin: true,
        approvedAt: new Date().toISOString(),
      });
      loadDeliveryBoys();
      alert('Delivery boy approved successfully!');
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (boyId: string) => {
    if (!confirm('Reject this application?')) return;
    try {
      await updateDoc(doc(db, 'deliveryBoys', boyId), { 
        status: 'Rejected',
        canLogin: false 
      });
      loadDeliveryBoys();
      alert('Application rejected');
    } catch (error) {
      alert('Failed to reject');
    }
  };

  const handleSuspend = async (boyId: string) => {
    const boy = deliveryBoys.find(b => b.id === boyId);
    if (!boy) return;

    const isActive = boy.status === 'Active';
    const newStatus = isActive ? 'Suspended' : 'Active';
    const newLoginStatus = newStatus === 'Active';

    if (confirm(`${newStatus} ${boy.firstName}?`)) {
      try {
        await updateDoc(doc(db, 'deliveryBoys', boyId), {
          status: newStatus,
          canLogin: newLoginStatus,
        });
        loadDeliveryBoys();
        alert(`Delivery boy ${newStatus.toLowerCase()} successfully`);
      } catch (error) {
        alert('Failed to update status');
      }
    }
  };

  const handleDelete = async (boyId: string) => {
    if (!confirm('Permanent delete? This action cannot be undone.')) return;
    try {
      await updateDoc(doc(db, 'deliveryBoys', boyId), {
        status: 'Deleted',
        canLogin: false,
      });
      loadDeliveryBoys();
      alert('Delivery boy deleted');
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleSaveEdit = async (data: any, password?: string) => {
    try {
      const updateData = { 
        ...data, 
        updatedAt: new Date().toISOString() 
      };
      
      if (password) {
        updateData.password = password;
      }

      await updateDoc(doc(db, 'deliveryBoys', selectedBoy!.id), updateData);
      loadDeliveryBoys();
      alert('Updated successfully!' + (password ? '\nNew password has been set.' : ''));
      setShowEditModal(false);
      setSelectedBoy(null);
    } catch (error) {
      alert('Update failed');
    }
  };

  const approvedBoys = deliveryBoys.filter(b => b.approved && b.status !== 'Deleted' && b.status !== 'Rejected');
  const pendingBoys = deliveryBoys.filter(b => !b.approved && b.status === 'Pending');

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading delivery boys data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-full mx-auto">
          {/* Header */}
<div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between">
  {/* Left Side: Page Title & Description */}
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
      Delivery Boys Management
    </h1>
    <p className="text-gray-600">
      Manage, review, and approve delivery partner applications
    </p>
  </div>

  {/* Right Side: Clickable Dashboard Button */}
  <div className="mt-4 sm:mt-0">  
      <button onClick={() => router.push('/deliverydashboard')}
      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
    >
      <Send className="w-5 h-5" />
      Delivery Dashboard
    </button>
  </div>
</div>
          {/* Stats Cards */}
          <StatsCards
            approvedCount={approvedBoys.length}
            pendingCount={pendingBoys.length}
            totalCount={deliveryBoys.length}
          />

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            {/* Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                    activeTab === 'approved'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved ({approvedBoys.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                    activeTab === 'pending'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({pendingBoys.length})
                </button>
              </div>

              <div className="relative w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full md:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <DeliveryBoysTable
              boys={filteredBoys}
              type={activeTab}
              onView={handleView}
              onEdit={handleEdit}
              onApprove={handleApprove}
              onReject={handleReject}
              onSuspend={handleSuspend}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Modals */}
        {showViewModal && selectedBoy && (
          <ViewModal
            boy={selectedBoy}
            onClose={() => {
              setShowViewModal(false);
              setSelectedBoy(null);
            }}
            onApprove={activeTab === 'pending' ? handleApprove : undefined}
            isPending={activeTab === 'pending'}
          />
        )}

        {showEditModal && selectedBoy && (
          <EditModal
            boy={selectedBoy}
            onClose={() => {
              setShowEditModal(false);
              setSelectedBoy(null);
            }}
            onSave={handleSaveEdit}
          />
        )}
      </main>
    </div>
  );
}