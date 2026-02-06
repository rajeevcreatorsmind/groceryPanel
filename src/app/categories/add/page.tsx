import { Suspense } from 'react';
import CategoryForm from './CategoryForm';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from '@/components/icons';

export default function AddCategoryPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-lg">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading form...
            </div>
          </div>
        }>
          <CategoryForm />
        </Suspense>
      </main>
    </div>
  );
}