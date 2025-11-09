"use client";
import { useEffect } from "react";
import useDataStore from "@/store";
import { SemuaUjianPageWithRouting } from "@/components/pages";
import { BookOpen } from "lucide-react";

export default function SemuaUjianPageRoute() {
  const { loadData } = useDataStore();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  );
}