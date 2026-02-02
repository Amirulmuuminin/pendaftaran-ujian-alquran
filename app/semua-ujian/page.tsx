"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "@/store";
import { SemuaUjianPageWithRouting } from "@/components/pages";
import { BookOpen, List, UserCheck } from "lucide-react";

export default function SemuaUjianPageRoute() {
  const { loadData } = useDataStore();
  const router = useRouter();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNavigateToHome = () => {
    router.push("/");
  };

  const handleNavigateToPengujis = () => {
    router.push("/penguji");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <BookOpen className="mr-3 text-blue-600" size={24} />
            <h1 className="text-xl font-semibold text-gray-900">Semua Ujian</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <SemuaUjianPageWithRouting />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around">
            <button
              onClick={handleNavigateToHome}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <List size={24} />
              <span className="text-xs mt-1 font-medium">Daftar Kelas</span>
            </button>
            <button
              onClick={handleNavigateToPengujis}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <UserCheck size={24} />
              <span className="text-xs mt-1 font-medium">Penguji</span>
            </button>
            <button
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-blue-600"
            >
              <BookOpen size={24} />
              <span className="text-xs mt-1 font-medium">Semua Ujian</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}