import React, { useState, useEffect } from "react";
import useDataStore from "../store";
import { DaftarKelasPage, SemuaUjianPage, ClassDetailPage } from "./pages";
import { List, BookOpen, Plus, ArrowLeft } from "lucide-react";

// Main App Component
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "exams" | "detail">("list");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { loadData } = useDataStore();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetail = (classId: string) => {
    setSelectedClassId(classId);
    setActiveTab("detail");
  };

  const handleBackToList = () => {
    setSelectedClassId(null);
    setActiveTab("list");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {activeTab === "detail" ? (
                  <button
                    onClick={handleBackToList}
                    className="mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                ) : null}
                <h1 className="text-xl font-semibold text-gray-900">
                  {activeTab === "list" && "Daftar Kelas"}
                  {activeTab === "exams" && "Semua Ujian"}
                  {activeTab === "detail" && "Detail Kelas"}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {activeTab === "list" && (
              <DaftarKelasPage />
            )}
            {activeTab === "exams" && <SemuaUjianPage />}
            {activeTab === "detail" && selectedClassId && (
              <ClassDetailPage
                classId={selectedClassId}
                onBack={handleBackToList}
              />
            )}
          </div>
        </main>

        {/* Bottom Navigation - Only show when not in detail view */}
        {activeTab !== "detail" && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex justify-around">
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors ${
                    activeTab === "list"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List size={24} />
                  <span className="text-xs mt-1 font-medium">Daftar Kelas</span>
                </button>
                <button
                  onClick={() => setActiveTab("exams")}
                  className={`flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors ${
                    activeTab === "exams"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BookOpen size={24} />
                  <span className="text-xs mt-1 font-medium">Semua Ujian</span>
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
  );
};

export default App;