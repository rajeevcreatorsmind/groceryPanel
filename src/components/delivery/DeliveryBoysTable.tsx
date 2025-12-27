'use client';

import { DeliveryBoy } from '@/types/delivery';
import { Eye, Edit2, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface DeliveryBoysTableProps {
  boys: DeliveryBoy[];
  type: 'approved' | 'pending';
  onView: (boy: DeliveryBoy) => void;
  onEdit: (boy: DeliveryBoy) => void;
  onApprove: (boyId: string) => void;
  onReject: (boyId: string) => void;
  onSuspend: (boyId: string) => void;
  onDelete: (boyId: string) => void;
}

export default function DeliveryBoysTable({
  boys,
  type,
  onView,
  onEdit,
  onApprove,
  onReject,
  onSuspend,
  onDelete
}: DeliveryBoysTableProps) {
  
  const getStatusBadge = (status: string, canLogin: boolean) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center";
    
    switch (status) {
      case 'Active':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active
            {!canLogin && <span className="ml-1 text-xs">(Login Blocked)</span>}
          </span>
        );
      case 'Suspended':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Suspended
          </span>
        );
      case 'Pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Pending
          </span>
        );
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Profile</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Bike No</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {boys.map((boy) => (
            <tr key={boy.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-10 w-10 flex-shrink-0">
                  {boy.profileImageUrl ? (
                    <img
                      src={boy.profileImageUrl}
                      alt={`${boy.firstName} ${boy.lastName}`}
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {boy.firstName.charAt(0)}{boy.lastName.charAt(0)}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {boy.firstName} {boy.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-900">{boy.phoneNumber}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  {boy.bikeNumber || '—'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-600">{boy.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(boy.status, boy.canLogin)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(boy)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {type === 'approved' ? (
                    <>
                      <button
                        onClick={() => onEdit(boy)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSuspend(boy.id)}
                        className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                        title={boy.status === 'Active' ? 'Suspend' : 'Activate'}
                      >
                        {boy.status === 'Active' ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => onDelete(boy.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onApprove(boy.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(boy.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {boys.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2 text-4xl">
            {type === 'approved' ? '📦' : '⏳'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No {type === 'approved' ? 'approved' : 'pending'} delivery boys
          </h3>
          <p className="text-gray-500">
            {type === 'approved' 
              ? 'All delivery boys are pending approval' 
              : 'No pending applications found'
            }
          </p>
        </div>
      )}
    </div>
  );
}