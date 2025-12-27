'use client';

interface StatsCardsProps {
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
}

export default function StatsCards({ approvedCount, pendingCount, totalCount }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{approvedCount}</div>
            <div className="text-sm opacity-90">Approved Delivery Boys</div>
          </div>
          <div className="text-2xl">✅</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <div className="text-sm opacity-90">Pending Approval</div>
          </div>
          <div className="text-2xl">⏱️</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{totalCount}</div>
            <div className="text-sm opacity-90">Total Delivery Boys</div>
          </div>
          <div className="text-2xl">👥</div>
        </div>
      </div>
    </div>
  );
}