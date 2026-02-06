'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Plus,
  X,
  Upload,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
} from '@/components/icons';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl: string;
  isActive: boolean;
  createdAt?: any;
}

const ITEMS_PER_PAGE = 6;

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Create form states
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImageUrlInput, setCreateImageUrlInput] = useState('');
  const [createImagePreview, setCreateImagePreview] = useState('');
  const [createImageSource, setCreateImageSource] = useState<'upload' | 'url'>('upload');
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editImageSource, setEditImageSource] = useState<'upload' | 'url'>('url');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE);
  const paginatedBrands = brands.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const q = query(collection(db, 'brands'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const brandList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Brand[];
        setBrands(brandList);
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId === null) return;
      const target = event.target as HTMLElement;
      if (
        target.closest('[data-menu-container]') ||
        target.closest('[data-menu-button]')
      ) {
        return;
      }
      setOpenMenuId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setEditName(brand.name);
    setEditDescription(brand.description || '');
    setEditImagePreview(brand.logoUrl);
    setEditImageUrlInput(brand.logoUrl);
    setEditImageSource('url');
    setEditIsActive(brand.isActive);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return alert('Brand name is required!');
    if (!createImagePreview) return alert('Please provide a logo image!');

    setCreateLoading(true);
    try {
      let finalLogoUrl = createImagePreview;
      if (createImageSource === 'upload' && createImageFile) {
        const storageRef = ref(
          storage,
          `brands/${Date.now()}_${createImageFile.name}`
        );
        await uploadBytes(storageRef, createImageFile);
        finalLogoUrl = await getDownloadURL(storageRef);
      } else if (createImageSource === 'url') {
        finalLogoUrl = createImageUrlInput.trim();
      }

      const brandRef = await addDoc(collection(db, 'brands'), {
        name: createName.trim(),
        description: createDescription.trim() || null,
        logoUrl: finalLogoUrl,
        isActive: createIsActive,
        createdAt: serverTimestamp(),
      });

      await updateDoc(brandRef, { id: brandRef.id });

      alert('Brand created successfully!');
      setShowCreateModal(false);
      setCreateName('');
      setCreateDescription('');
      setCreateImageFile(null);
      setCreateImageUrlInput('');
      setCreateImagePreview('');
      setCreateImageSource('upload');
      setCreateIsActive(true);
      window.location.reload();
    } catch (err) {
      console.error('Error creating brand:', err);
      alert('Failed to create brand');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editName.trim()) return alert('Brand name is required!');

    setEditLoading(true);
    try {
      let finalLogoUrl = editImagePreview;
      if (editImageSource === 'upload' && editImageFile) {
        const storageRef = ref(
          storage,
          `brands/${Date.now()}_${editImageFile.name}`
        );
        await uploadBytes(storageRef, editImageFile);
        finalLogoUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'brands', editingBrand.id), {
        name: editName.trim(),
        description: editDescription.trim() || null,
        logoUrl: finalLogoUrl,
        isActive: editIsActive,
      });

      alert('Brand updated successfully!');
      setShowEditModal(false);
      setEditingBrand(null);
      window.location.reload();
    } catch (err) {
      console.error('Error updating brand:', err);
      alert('Failed to update brand');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      await deleteDoc(doc(db, 'brands', brandId));
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
      alert('Brand deleted successfully!');
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Failed to delete brand');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Brands Management
              </h1>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add New Brand
            </button>
          </div>

{/* Table */}
{loading ? (
  <div className="text-center py-20 text-gray-500">Loading brands...</div>
) : brands.length === 0 ? (
  <div className="text-center py-20 text-gray-500">
    No brands found. Add your first brand!
  </div>
) : (
  <>
    <div className="bg-white rounded-2xl shadow overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Logo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                ID
              </th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedBrands.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {brand.name}
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                  {brand.description || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      brand.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {brand.id}
                </td> */}

                {/* New Actions Column - Icons only */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(brand)}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pagination */}
    <div className="mt-6 flex items-center justify-between">
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </button>

      <span className="text-gray-700">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Next
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </>
)}
          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create New Brand
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateBrand} className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left - Form Fields */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          placeholder="e.g. Parle, Britannia, Sweet"
                          className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={createDescription}
                          onChange={(e) => setCreateDescription(e.target.value)}
                          placeholder="Short description about the brand..."
                          rows={4}
                          className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createIsActive}
                            onChange={(e) => setCreateIsActive(e.target.checked)}
                            className="w-6 h-6 text-purple-600 rounded"
                          />
                          <span className="text-lg font-medium text-gray-700">
                            Active
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Right - Logo Upload */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Brand Logo <span className="text-red-500">*</span>
                      </h3>

                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setCreateImageSource('upload')}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            createImageSource === 'upload'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateImageSource('url')}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            createImageSource === 'url'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          URL
                        </button>
                      </div>

                      {createImageSource === 'upload' && (
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCreateImageFile(file);
                                setCreateImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 transition">
                            {createImagePreview ? (
                              <img
                                src={createImagePreview}
                                alt="Preview"
                                className="mx-auto max-h-56 rounded-xl object-contain"
                              />
                            ) : (
                              <>
                                <Upload className="mx-auto text-gray-400 mb-4 w-12 h-12" />
                                <p className="text-lg font-medium text-gray-700">
                                  Click to upload logo
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                  PNG, JPG, WebP
                                </p>
                              </>
                            )}
                          </div>
                        </label>
                      )}

                      {createImageSource === 'url' && (
                        <>
                          <input
                            type="url"
                            value={createImageUrlInput}
                            onChange={(e) => {
                              setCreateImageUrlInput(e.target.value);
                              setCreateImagePreview(e.target.value.trim());
                            }}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                          />
                          {createImagePreview && (
                            <img
                              src={createImagePreview}
                              alt="Preview"
                              className="mx-auto max-h-56 rounded-xl object-contain"
                              onError={() => setCreateImagePreview('')}
                            />
                          )}
                        </>
                      )}

                      {createImagePreview && (
                        <p className="text-green-600 text-center font-medium">
                          ✓ Logo ready
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-8 py-4 border border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition"
                    >
                      {createLoading ? 'Creating...' : 'Create Brand'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editingBrand && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Brand</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateBrand} className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Parle, Britannia"
                          className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Short description about the brand..."
                          rows={4}
                          className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsActive}
                            onChange={(e) => setEditIsActive(e.target.checked)}
                            className="w-6 h-6 text-purple-600 rounded"
                          />
                          <span className="text-lg font-medium text-gray-700">
                            Active
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Brand Logo
                      </h3>

                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setEditImageSource('upload')}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            editImageSource === 'upload'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Upload New
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditImageSource('url')}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            editImageSource === 'url'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Keep Current
                        </button>
                      </div>

                      {editImagePreview && (
                        <img
                          src={editImagePreview}
                          alt="Current logo"
                          className="mx-auto max-h-56 rounded-xl object-contain"
                        />
                      )}

                      {editImageSource === 'upload' && (
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditImageFile(file);
                                setEditImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-purple-400 transition">
                            <p className="text-lg font-medium text-gray-700">
                              Click to upload new logo
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-8 py-4 border border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl disabled:opacity-70 transition"
                    >
                      {editLoading ? 'Updating...' : 'Update Brand'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}