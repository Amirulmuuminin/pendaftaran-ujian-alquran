"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "../../store";
import {
  BookOpen,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Dialog, Input, Button } from "../ui";
import { toast } from "sonner";
import { ExamProblem } from "../../types";

type ExamTabType = "upcoming" | "completed";

const SemuaUjianPageWithRouting: React.FC = () => {
  const router = useRouter();
  const {
    classes,
    loading,
    updateExam,
    detectExamProblems,
    pengujis,
    loadData,
  } = useDataStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<ExamTabType>("upcoming");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Form state
  const [examinerName, setExaminerName] = useState("");
  const [examinerPassword, setExaminerPassword] = useState("");
  const [score, setScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deteksi Masalah Modal state
  const [isDeteksiModalOpen, setIsDeteksiModalOpen] = useState(false);
  const [problems, setProblems] = useState<ExamProblem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Backup Modal state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load problems on mount for badge count
  useEffect(() => {
    const loadInitialProblems = async () => {
      const detectedProblems = await detectExamProblems();
      setProblems(detectedProblems);
    };
    loadInitialProblems();
  }, [detectExamProblems]);

  const handleBack = () => {
    router.push("/");
  };

  const handleExamClick = (exam: any) => {
    setSelectedExam(exam);
    setExaminerName(exam.examiner_name || "");
    setExaminerPassword(exam.examiner_password || "");
    setScore(
      exam.score !== null && exam.score !== undefined ? String(exam.score) : "",
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
    setExaminerName("");
    setExaminerPassword("");
    setScore("");
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    // Validate hardcoded password
    const HARDCODED_PASSWORD = "ujianquransibia";
    if (examinerPassword !== HARDCODED_PASSWORD) {
      toast.error("Password salah!");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateExam(
        selectedExam.classId,
        selectedExam.studentId,
        selectedExam.id,
        {
          status: "completed",
          examiner_name: examinerName || null,
          score: score || null,
        },
      );
      toast.success("Data ujian berhasil diperbarui!");
      handleCloseModal();
    } catch (error) {
      toast.error("Gagal memperbarui data ujian. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deteksi Masalah handlers
  const loadProblems = async () => {
    setLoadingProblems(true);
    const detectedProblems = await detectExamProblems();
    setProblems(detectedProblems);
    setLoadingProblems(false);
  };

  const handleOpenDeteksiModal = () => {
    setIsDeteksiModalOpen(true);
    loadProblems();
  };

  const handleCloseDeteksiModal = () => {
    setIsDeteksiModalOpen(false);
  };

  // Backup handlers
  const {
    exportToExcel,
    generateBackupFilename,
  } = require("../../lib/backup/client-export");

  const getTotalDataCount = () => {
    const studentsCount = classes.reduce(
      (sum, cls) => sum + cls.students.length,
      0,
    );
    const examsCount = classes.reduce(
      (sum, cls) =>
        sum + cls.students.reduce((s, stu) => s + (stu.exams?.length || 0), 0),
      0,
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
          })),
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
            })),
          ),
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

  const handleOpenBackupModal = () => {
    setIsBackupModalOpen(true);
  };

  const handleCloseBackupModal = () => {
    setIsBackupModalOpen(false);
  };

  const upcomingExams = useMemo(() => {
    if (loading) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allExams: any[] = [];

    classes.forEach((classItem) => {
      classItem.students?.forEach((student) => {
        student.exams?.forEach((exam) => {
          if (exam.status === "scheduled") {
            const examDate = new Date(exam.exam_date * 1000);
            examDate.setHours(0, 0, 0, 0);

            // Only include if exam date is today or in the future
            if (examDate.getTime() >= today.getTime()) {
              allExams.push({
                ...exam,
                studentName: student.name,
                className: classItem.name,
                studentId: student.id,
                classId: classItem.id,
              });
            }
          }
        });
      });
    });

    // Helper to extract period number from "Jam ke-X"
    const getPeriodNumber = (period: string): number => {
      const match = period.match(/Jam ke-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Sort by exam date first, then by exam period
    return allExams.sort((a, b) => {
      const dateDiff = a.exam_date - b.exam_date;
      if (dateDiff !== 0) return dateDiff;

      // Same date, sort by period
      return getPeriodNumber(a.exam_period) - getPeriodNumber(b.exam_period);
    });
  }, [classes, loading]);

  const completedExams = useMemo(() => {
    if (loading) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allExams: any[] = [];

    classes.forEach((classItem) => {
      classItem.students?.forEach((student) => {
        student.exams?.forEach((exam) => {
          const examDate = new Date(exam.exam_date * 1000);
          examDate.setHours(0, 0, 0, 0);

          // Include if status is 'completed' OR exam date has passed
          if (
            exam.status === "completed" ||
            examDate.getTime() < today.getTime()
          ) {
            allExams.push({
              ...exam,
              studentName: student.name,
              className: classItem.name,
              studentId: student.id,
              classId: classItem.id,
            });
          }
        });
      });
    });

    // Helper to extract period number from "Jam ke-X"
    const getPeriodNumber = (period: string): number => {
      const match = period.match(/Jam ke-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Sort by exam date first, then by exam period
    return allExams.sort((a, b) => {
      const dateDiff = a.exam_date - b.exam_date;
      if (dateDiff !== 0) return dateDiff;

      // Same date, sort by period
      return getPeriodNumber(a.exam_period) - getPeriodNumber(b.exam_period);
    });
  }, [classes, loading]);

  // Group problems by type
  const excess1JuzProblems = problems.filter((p) => p.type === "excess-1juz");
  const excessHalfJuzProblems = problems.filter(
    (p) => p.type === "excess-halfjuz",
  );
  const dailyLimitProblems = problems.filter((p) => p.type === "daily-limit");

  // Render problem card for excess-1juz and excess-halfjuz
  const renderStudentProblemCard = (problem: ExamProblem) => (
    <div
      key={problem.id}
      className={`border rounded-lg p-4 ${
        problem.type === "excess-1juz"
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 ${
            problem.type === "excess-1juz" ? "text-red-600" : "text-amber-600"
          }`}
        >
          {problem.type === "excess-1juz" ? (
            <AlertTriangle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {problem.displayDate}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Penguji: {problem.examinerName}
          </p>
          {problem.students && problem.students.length > 0 && (
            <ul className="space-y-1">
              {problem.students.map((student, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  • {student.studentName} - {student.className} - Juz{" "}
                  {student.juzNumber}
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
          <p className="text-sm font-medium text-gray-900 mb-2">
            {problem.displayDate}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Penguji: {problem.examinerName}
          </p>
          <p className="text-sm text-purple-700 font-semibold">
            Ujian: {problem.examCount} / Max: {problem.maxLimit}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenDeteksiModal}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <AlertTriangle size={16} />
              <span>Deteksi Masalah</span>
              {problems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-700 rounded-full text-xs">
                  {problems.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleOpenBackupModal}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download size={16} />
              <span>Backup</span>
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Semua Ujian</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "upcoming"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Calendar size={18} />
          <span>Ujian Mendatang</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === "upcoming"
                ? "bg-blue-200 text-blue-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {upcomingExams.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === "completed"
              ? "text-green-600 border-b-2 border-green-600 bg-green-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <BookOpen size={18} />
          <span>Ujian Selesai</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === "completed"
                ? "bg-green-200 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {completedExams.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "upcoming" ? (
        <>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Tidak ada ujian mendatang
              </h3>
              <p className="text-gray-500">
                Semua jadwal ujian sudah lewat atau belum ada yang dijadwalkan
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => handleExamClick(exam)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {exam.studentName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.className}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Juz: {exam.juz_number || "-"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {exam.examiner_name ? (
                          <div className="text-xs text-gray-500">
                            Penguji: {exam.examiner_name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Penguji: Ustadz Nawir
                          </div>
                        )}
                        {exam.score !== null && (
                          <div className="text-xs font-medium text-blue-600">
                            Nilai: {exam.score}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exam.exam_day},{" "}
                        {new Date(exam.exam_date * 1000).toLocaleDateString(
                          "id-ID",
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.exam_period}
                      </div>
                      <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full inline-block">
                        {exam.exam_type === "5juz" ? "5 Juz" : "Non 5 Juz"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {completedExams.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Belum ada ujian selesai
              </h3>
              <p className="text-gray-500">
                Ujian yang sudah lewat atau selesai akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {completedExams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => handleExamClick(exam)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {exam.studentName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.className}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Juz: {exam.juz_number || "-"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {exam.examiner_name ? (
                          <div className="text-xs text-gray-500">
                            Penguji: {exam.examiner_name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Penguji: Ustadz Nawir
                          </div>
                        )}
                        {exam.score !== null && (
                          <div className="text-sm font-medium text-green-600">
                            Nilai: {exam.score}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exam.exam_day},{" "}
                        {new Date(exam.exam_date * 1000).toLocaleDateString(
                          "id-ID",
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.exam_period}
                      </div>
                      <div className="mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full inline-block">
                        {exam.exam_type === "5juz" ? "5 Juz" : "Non 5 Juz"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Exam Detail Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Detail Ujian"
      >
        <form onSubmit={handleSubmitExam}>
          <div className="space-y-4">
            {/* Exam Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Murid:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExam?.studentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kelas:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExam?.className}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Juz:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExam?.juz_number || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jadwal:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExam?.exam_day},{" "}
                  {new Date(selectedExam?.exam_date * 1000).toLocaleDateString(
                    "id-ID",
                  )}{" "}
                  - {selectedExam?.exam_period}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <Input
              label="Nama Penguji"
              type="text"
              value={examinerName}
              onChange={(e) => setExaminerName(e.target.value)}
              placeholder="Masukkan nama penguji"
            />

            <Input
              label="Password"
              type="password"
              value={examinerPassword}
              onChange={(e) => setExaminerPassword(e.target.value)}
              placeholder="Masukkan password"
            />

            <Input
              label="Nilai"
              type="text"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Masukkan nilai (mis: 85, A, B)"
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Deteksi Masalah Modal */}
      <Dialog
        isOpen={isDeteksiModalOpen}
        onClose={handleCloseDeteksiModal}
        title="Deteksi Masalah Ujian"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {loadingProblems
                ? "Memeriksa masalah..."
                : `Ditemukan ${problems.length} masalah`}
            </p>
            <button
              onClick={loadProblems}
              disabled={loadingProblems}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingProblems ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loadingProblems ? (
            <div className="text-center py-8">
              <RefreshCw
                size={32}
                className="mx-auto text-gray-400 animate-spin mb-2"
              />
              <p className="text-sm text-gray-600">Memeriksa masalah...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-600 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                Tidak Ada Masalah
              </h3>
              <p className="text-green-700 text-xs">
                Semua jadwal ujian dalam kondisi baik.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Lebih dari 1 Murid 1 Juz */}
              {excess1JuzProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-red-100 text-red-700 p-1.5 rounded-lg">
                      <AlertTriangle size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-red-800">
                      Lebih dari 1 Murid 1 Juz ({excess1JuzProblems.length})
                    </h3>
                  </div>
                  <p className="text-xs text-red-600 mb-2 ml-8">
                    Seharusnya maksimal 1 murid ujian 1 juz per jam per penguji
                  </p>
                  <div className="space-y-2 ml-8">
                    {excess1JuzProblems.map(renderStudentProblemCard)}
                  </div>
                </div>
              )}

              {/* Lebih dari 2 Murid 1/2 Juz */}
              {excessHalfJuzProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                      <AlertCircle size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-amber-800">
                      Lebih dari 2 Murid 1/2 Juz ({excessHalfJuzProblems.length}
                      )
                    </h3>
                  </div>
                  <p className="text-xs text-amber-600 mb-2 ml-8">
                    Seharusnya maksimal 2 murid ujian 1/2 juz per jam per
                    penguji
                  </p>
                  <div className="space-y-2 ml-8">
                    {excessHalfJuzProblems.map(renderStudentProblemCard)}
                  </div>
                </div>
              )}

              {/* Penguji Lewati Batas Harian */}
              {dailyLimitProblems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-100 text-purple-700 p-1.5 rounded-lg">
                      <AlertTriangle size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-purple-800">
                      Penguji Lewati Batas Harian ({dailyLimitProblems.length})
                    </h3>
                  </div>
                  <p className="text-xs text-purple-600 mb-2 ml-8">
                    Penguji melebihi batas maksimal ujian per hari
                  </p>
                  <div className="space-y-2 ml-8">
                    {dailyLimitProblems.map(renderDailyLimitCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* Backup Modal */}
      <Dialog
        isOpen={isBackupModalOpen}
        onClose={handleCloseBackupModal}
        title="Backup Data"
      >
        <div className="space-y-4">
          {/* Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Ringkasan Data
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">
                  {counts.classes}
                </p>
                <p className="text-xs text-gray-600">Kelas</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600">
                  {counts.students}
                </p>
                <p className="text-xs text-gray-600">Siswa</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-600">
                  {counts.exams}
                </p>
                <p className="text-xs text-gray-600">Ujian</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-600">
                  {counts.pengujis}
                </p>
                <p className="text-xs text-gray-600">Penguji</p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Download semua data dalam format Excel (.xlsx) untuk disimpan
              secara lokal.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Download size={18} />
              {isDownloading ? "Memproses..." : "Download Backup (.xlsx)"}
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">
              Tentang Backup
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• File backup berisi seluruh data aplikasi</li>
              <li>• Data diformat dengan sheet terpisah untuk setiap tabel</li>
              <li>• Simpan file backup secara berkala untuk keamanan data</li>
            </ul>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default SemuaUjianPageWithRouting;
