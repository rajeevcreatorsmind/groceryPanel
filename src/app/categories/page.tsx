"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  MoreVertical,
  Eye,
} from "@/components/icons";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: "active" | "inactive";
  level: number;
  parentId: string | null;
  parentName?: string | null;
  productCount: number;
  sortOrder?: number;
  children?: any[];
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuDirection, setMenuDirection] = useState<"up" | "down">("down");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      orderBy("level", "asc"),
      orderBy("sortOrder", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];

        setCategories(cats);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // const toggleMenu = (id: string) => {
  //   setOpenMenuId(openMenuId === id ? null : id);
  // };
  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Agar niche space kam hai → upar open
    if (viewportHeight - rect.bottom < 220) {
      setMenuDirection("up");
    } else {
      setMenuDirection("down");
    }

    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  // Only top-level (parent) categories
  const parentCategories = categories.filter((cat) => cat.level === 0);

  const filteredParents = parentCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description &&
        cat.description.toLowerCase().includes(search.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredParents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredParents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">
              Manage your top-level product categories
            </p>
          </div>
          <Link
            href="/categories/add?mode=create"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Parent Category
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-4 px-6 font-medium text-gray-700">
                  Category
                </th>
                <th className="py-4 px-6 font-medium text-gray-700">
                  Subcategories
                </th>
                <th className="py-4 px-6 font-medium text-gray-700">
                  Products
                </th>
                <th className="py-4 px-6 font-medium text-gray-700">Status</th>
                <th className="py-4 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {parentCategories.length === 0
                      ? "No categories yet"
                      : "No matching categories"}
                  </td>
                </tr>
              ) : (
                currentItems.map((category) => {
                  const subCount = category.children?.length || 0;

                  return (
                    <tr key={category.id} className="group hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <FolderTree className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="font-medium">{category.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex items-center gap-3">
                          <span>{subCount}</span>
                          {subCount > 0 && (
                            <Link
                              href={`/categories/${category.id}/subcategories`}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {category.productCount || 0}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            category.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => toggleMenu(category.id, e)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {openMenuId === category.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                className={`
    absolute right-2 z-50 w-56 rounded-lg shadow-xl
    border border-gray-200 bg-white overflow-hidden
    ${menuDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"}
  `}
                              >
                                <div className="py-1">
                                  {subCount > 0 && (
                                    <Link
                                      href={`/categories/${category.id}/subcategories`}
                                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Subcategories
                                    </Link>
                                  )}

                                  <Link
                                    href={`/categories/add?mode=create-child&parentId=${category.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Create Subcategory
                                  </Link>

                                  <div className="border-t border-gray-200 my-1" />

                                  <Link
                                    href={`/categories/edit/${category.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                  </Link>

                                  <button
                                    onClick={() => {
                                      handleDelete(category.id, category.name);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredParents.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 gap-4">
            <div>
              Showing {startIndex + 1}–
              {Math.min(endIndex, filteredParents.length)} of{" "}
              {filteredParents.length}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
