"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "@/store";
import {
  Download,
  List,
  UserCheck,
  BookOpen,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportToExcel,
  generateBackupFilename,
} from "@/lib/backup/client-export";

export default function BackupPage() {
  const router = useRouter();
  const { classes, pengujis, loadData } = useDataStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const getTotalDataCount = () => {
    const studentsCount = classes.reduce((sum, cls) => sum + cls.students.length, 0);
    const examsCount = classes.reduce(
      (sum, cls) => sum + cls.students.reduce((s, stu) => s + (stu.exams?.length || 0), 0),
      0
    );
    return {
      classes: classes.length,
      students: studentsCount,
      exams: examsCount,
      pengujis: pengujis.length,
    };
  };

  const counts = getTotalDataCount();

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      // Ensure data is loaded
      await loadData();

      // Gather all data
      const data = {
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          schedule: c.schedule,
          created_at: c.created_at,
          updated_at: c.updated_at,
        })),
        students: classes.flatMap((cls) =>
          cls.students.map((s) => ({
            id: s.id,
            class_id: s.class_id,
            name: s.name,
            created_at: s.created_at,
            updated_at: s.updated_at,
          }))
        ),
        exams: classes.flatMap((cls) =>
          cls.students.flatMap((stu) =>
            (stu.exams || []).map((e) => ({
              id: e.id,
              student_id: e.student_id,
              class_id: e.class_id,
              exam_date: e.exam_date,
              exam_date_key: e.exam_date_key,
              status: e.status,
              score: e.score,
              juz_number: e.juz_number,
              exam_type: e.exam_type,
              notes: e.notes,
              exam_day: e.exam_day,
              exam_period: e.exam_period,
              examiner_name: e.examiner_name,
              created_at: e.created_at,
              updated_at: e.updated_at,
            }))
          )
        ),
        pengujis: pengujis.map((p) => ({
          id: p.id,
          name: p.name,
          schedule: p.schedule,
          supported_exam_types: p.supported_exam_types,
          max_exams_per_day: p.max_exams_per_day,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })),
      };

      // Export to Excel
      const filename = generateBackupFilename();
      exportToExcel(data, filename);

      toast.success("Backup berhasil diunduh!");
    } catch (error) {
      console.error("Backup error:", error);
      toast.error("Gagal membuat backup");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <Settings className="mr-3 text-blue-600" size={24} />
            <h1 className="text-xl font-semibold text-gray-900">Backup Data</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Data Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{counts.classes}</p>
                <p className="text-sm text-gray-600">Kelas</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{counts.students}</p>
                <p className="text-sm text-gray-600">Siswa</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{counts.exams}</p>
                <p className="text-sm text-gray-600">Ujian</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">{counts.pengujis}</p>
                <p className="text-sm text-gray-600">Penguji</p>
              </div>
            </div>
          </div>

          {/* Manual Download */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Backup</h2>
            <p className="text-sm text-gray-600 mb-6">
              Download semua data dalam format Excel (.xlsx) untuk disimpan secara lokal.
              File berisi data Kelas, Siswa, Ujian, dan Penguji.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              {isDownloading ? "Memproses..." : "Download Backup (.xlsx)"}
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Tentang Backup</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• File backup berisi seluruh data aplikasi</li>
              <li>• Data diformat dengan sheet terpisah untuk setiap tabel</li>
              <li>• Simpan file backup secara berkala untuk keamanan data</li>
              <li>• File dapat dibuka di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around">
            <button
              onClick={() => router.push("/")}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <List size={24} />
              <span className="text-xs mt-1 font-medium">Daftar Kelas</span>
            </button>
            <button
              onClick={() => router.push("/penguji")}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <UserCheck size={24} />
              <span className="text-xs mt-1 font-medium">Penguji</span>
            </button>
            <button
              onClick={() => router.push("/semua-ujian")}
              className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-gray-500 hover:text-gray-700"
            >
              <BookOpen size={24} />
              <span className="text-xs mt-1 font-medium">Semua Ujian</span>
            </button>
            <button className="flex flex-col items-center py-3 px-4 min-w-0 flex-1 transition-colors text-blue-600">
              <Settings size={24} />
              <span className="text-xs mt-1 font-medium">Backup</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
