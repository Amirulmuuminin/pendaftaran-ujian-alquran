"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "@/store";
import { ExamProblem } from "@/types";
import { AlertTriangle, AlertCircle, List, UserCheck, BookOpen, RefreshCw, Settings } from "lucide-react";

export default function DeteksiMasalahPage() {
  const router = useRouter();
  const { loadData } = useDataStore();
  const [problems, setProblems] = useState<ExamProblem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProblems = async () => {
    setLoading(true);
    await loadData();
    const detectedProblems = await useDataStore.getState().detectExamProblems();
    setProblems(detectedProblems);
    setLoading(false);
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleNavigateToHome = () => {
    router.push("/");
  };

  const handleNavigateToPengujis = () => {
    router.push("/penguji");
  };

  const handleNavigateToExams = () => {
    router.push("/semua-ujian");
  };

  const handleNavigateToBackup = () => {
    router.push("/backup");
  };

  // Group problems by type
  const excess1JuzProblems = problems.filter(p => p.type === 'excess-1juz');
  const excessHalfJuzProblems = problems.filter(p => p.type === 'excess-halfjuz');
  const dailyLimitProblems = problems.filter(p => p.type === 'daily-limit');

  // Render problem card for excess-1juz and excess-halfjuz
  const renderStudentProblemCard = (problem: ExamProblem) => (
    <div
      key={problem.id}
      className={`border rounded-lg p-4 ${
        problem.type === 'excess-1juz'
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${
          problem.type === 'excess-1juz' ? 'text-red-600' : 'text-amber-600'
        }`}>
          {problem.type === 'excess-1juz' ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-2">{problem.displayDate}</p>
          <p className="text-sm text-gray-600 mb-2">Penguji: {problem.examinerName}</p>
          {problem.students && problem.students.length > 0 && (
            <ul className="space-y-1">
              {problem.students.map((student, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  • {student.studentName} - {student.className} - Juz {student.juzNumber}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  // Render problem card for daily-limit
  const renderDailyLimitCard = (problem: ExamProblem) => (
    <div
      key={problem.id}
      className="bg-purple-50 border-purple-200 border rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-purple-600">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-2">{problem.displayDate}</p>
          <p className="text-sm text-gray-600 mb-2">Penguji: {problem.examinerName}</p>
          <p className="text-sm text-purple-700 font-semibold">
            Ujian: {problem.examCount} / Max: {problem.maxLimit}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <AlertTriangle className="mr-3 text-orange-600" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">Deteksi Masalah Ujian</h1>
            </div>
            <button
              onClick={loadProblems}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-600">Memeriksa masalah...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Tidak Ada Masalah</h3>
              <p className="text-green-700 text-sm">Semua jadwal ujian dalam kondisi baik.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lebih dari 1 Murid 1 Juz */}
              {excess1JuzProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-red-100 text-red-700 p-2 rounded-lg">
                      <AlertTriangle size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-red-800">
                      Lebih dari 1 Murid 1 Juz ({excess1JuzProblems.length})
                    </h2>
                  </div>
                  <p className="text-sm text-red-600 mb-3 ml-10">
                    Seharusnya maksimal 1 murid ujian 1 juz per jam per penguji
                  </p>
                  <div className="space-y-3 ml-10">
                    {excess1JuzProblems.map(renderStudentProblemCard)}
                  </div>
                </div>
              )}

              {/* Lebih dari 2 Murid 1/2 Juz */}
              {excessHalfJuzProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                      <AlertCircle size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-amber-800">
                      Lebih dari 2 Murid 1/2 Juz ({excessHalfJuzProblems.length})
                    </h2>
                  </div>
                  <p className="text-sm text-amber-600 mb-3 ml-10">
                    Seharusnya maksimal 2 murid ujian 1/2 juz per jam per penguji
                  </p>
                  <div className="space-y-3 ml-10">
                    {excessHalfJuzProblems.map(renderStudentProblemCard)}
                  </div>
                </div>
              )}

              {/* Penguji Lewati Batas Harian */}
              {dailyLimitProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                      <AlertTriangle size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-purple-800">
                      Penguji Lewati Batas Harian ({dailyLimitProblems.length})
                    </h2>
                  </div>
                  <p className="text-sm text-purple-600 mb-3 ml-10">
                    Penguji melebihi batas maksimal ujian per hari
                  </p>
                  <div className="space-y-3 ml-10">
                    {dailyLimitProblems.map(renderDailyLimitCard)}
                  </div>
                </div>
              )}
            </div>
          )}
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
              onClick={handleNavigateToExams}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <BookOpen size={24} />
              <span className="text-xs mt-1 font-medium">Semua Ujian</span>
            </button>
            <button className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-orange-600">
              <AlertTriangle size={24} />
              <span className="text-xs mt-1 font-medium">Deteksi Masalah</span>
            </button>
            <button
              onClick={handleNavigateToBackup}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <Settings size={24} />
              <span className="text-xs mt-1 font-medium">Backup</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
