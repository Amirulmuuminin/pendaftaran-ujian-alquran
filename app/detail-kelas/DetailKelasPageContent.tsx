"use client";
import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useDataStore from "@/store";
import { ClassDetailPage } from "@/components/pages";
import { ArrowLeft, Users } from "lucide-react";

export default function DetailKelasPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get("id");
  const { findClass, loading, loadData } = useDataStore();

  // Load data on component mount to handle direct page access/reload
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Use useMemo instead of useEffect + useState to derive state
  const classItem = useMemo(() => {
    return classId ? findClass(classId) : null;
  }, [classId, findClass]);

  const handleBack = () => {
    router.push("/");
  };

  // Show loading while data is being loaded or while classId is being processed
  if (loading || (classId && !classItem)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!classId || !classItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-3" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Kelas Tidak Ditemukan
          </h2>
          <p className="text-gray-500 mb-4">
            Kelas yang Anda cari tidak ada atau telah dihapus
          </p>
          <button
            onClick={handleBack}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Kembali ke Daftar Kelas"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </button>
            <Users className="mr-3 text-blue-600" size={24} />
            <h1 className="text-xl font-semibold text-gray-900">
              Detail Kelas
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <ClassDetailPage classId={classId!} onBack={handleBack} />
        </div>
      </main>
    </div>
  );
}