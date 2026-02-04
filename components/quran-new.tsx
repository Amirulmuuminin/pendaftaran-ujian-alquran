"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "../store";
import { DaftarKelasPage } from "./pages";
import { List, BookOpen, UserCheck } from "lucide-react";

// Main App Component with Next.js routing
const QuranNewApp: React.FC = () => {
  const router = useRouter();
  const { loadData } = useDataStore();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNavigateToExams = () => {
    router.push("/semua-ujian");
  };

  const handleNavigateToPengujis = () => {
    router.push("/penguji");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <List className="mr-3 text-blue-600" size={24} />
                <h1 className="text-xl font-semibold text-gray-900">Daftar Kelas</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <DaftarKelasPage />
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-around">
              <button
                className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-blue-600"
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
                onClick={handleNavigateToExams}
                className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
              >
                <BookOpen size={24} />
                <span className="text-xs mt-1 font-medium">Semua Ujian</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
  );
};

export default QuranNewApp;