'use client';

import { DeliveryBoy } from '@/types/delivery';
import { X, Eye, EyeOff, Download, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ViewModalProps {
  boy: DeliveryBoy;
  onClose: () => void;
  onApprove?: (boyId: string) => void;
  isPending?: boolean;
}

export default function ViewModal({ boy, onClose, onApprove, isPending = false }: ViewModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getStatusBadge = (status: string, canLogin: boolean) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center";
    
    switch (status) {
      case 'Active':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active
            {!canLogin && <span className="ml-1 text-xs">(Login Blocked)</span>}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Delivery Boy Details - {boy.firstName} {boy.lastName}
              </h2>
              <div className="mt-2">
                {getStatusBadge(boy.status, boy.canLogin)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Profile & Basic Info */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex flex-col items-center">
                  {boy.profileImageUrl ? (
                    <img
                      src={boy.profileImageUrl}
                      alt={`${boy.firstName} ${boy.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                      {boy.firstName.charAt(0)}{boy.lastName.charAt(0)}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{boy.firstName} {boy.lastName}</h3>
                  <p className="text-gray-600">{boy.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Phone Number</div>
                      <div className="font-medium">{boy.phoneNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Bike Number</div>
                      <div className="font-medium">{boy.bikeNumber || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div className="font-medium">{boy.address || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Documents & Details */}
            <div className="md:col-span-2">
              {/* Password Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Login Credentials</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="font-medium">{boy.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Password</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border rounded-lg px-3 py-2 font-mono">
                        {showPassword ? boy.password || 'Not set' : '••••••••••'}
                      </div>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Delivery boy will use this password to login
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Document Numbers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Aadhaar Number</div>
                    <div className="font-medium">{boy.aadhaarNumber || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">PAN Number</div>
                    <div className="font-medium">{boy.panNumber || 'Not provided'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Driving License</div>
                    <div className="font-medium">{boy.drivingNumber || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Application Timeline */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-3">Application Timeline</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Applied On</div>
                    <div className="font-medium">
                      {boy.createdAt ? new Date(boy.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  {boy.approvedAt && (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Approved On</div>
                      <div className="font-medium">
                        {new Date(boy.approvedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Login Status</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      boy.canLogin 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {boy.canLogin ? 'Allowed' : 'Blocked'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Links */}
          <div className="mt-6 bg-white border rounded-xl p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Document Files</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
{['aadhaar', 'pan', 'driving', 'vehicle'].map((type) => {
  const docUrl = boy[`${type}DocUrl` as keyof DeliveryBoy];

  return (
    <div key={type} className="text-center">
      <div className="text-sm text-gray-500 mb-1 capitalize">
        {type === 'aadhaar' ? 'Aadhaar' : 
         type === 'pan' ? 'PAN' : 
         type === 'driving' ? 'Driving License' : 
         'Vehicle RC'}
      </div>

      {typeof docUrl === 'string' && docUrl ? (
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          View PDF
        </a>
      ) : (
        <div className="text-gray-400 text-sm">Not uploaded</div>
      )}
    </div>
  );
})}
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          {isPending && onApprove && (
            <button
              onClick={() => onApprove(boy.id)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Delivery Boy
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}