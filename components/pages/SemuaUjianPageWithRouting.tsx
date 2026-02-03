"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "../../store";
import { BookOpen, Calendar, User, ArrowLeft } from "lucide-react";
import { Dialog, Input, Button } from "../ui";
import { toast } from "sonner";

type ExamTabType = 'upcoming' | 'completed';

const SemuaUjianPageWithRouting: React.FC = () => {
  const router = useRouter();
  const { classes, loading, updateExam } = useDataStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<ExamTabType>('upcoming');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Form state
  const [examinerName, setExaminerName] = useState("");
  const [examinerPassword, setExaminerPassword] = useState("");
  const [score, setScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleExamClick = (exam: any) => {
    setSelectedExam(exam);
    setExaminerName(exam.examiner_name || "");
    setExaminerPassword(exam.examiner_password || "");
    setScore(exam.score !== null && exam.score !== undefined ? String(exam.score) : "");
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
        }
      );
      toast.success("Data ujian berhasil diperbarui!");
      handleCloseModal();
    } catch (error) {
      toast.error("Gagal memperbarui data ujian. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingExams = useMemo(() => {
    if (loading) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allExams: any[] = [];

    classes.forEach(classItem => {
      classItem.students?.forEach(student => {
        student.exams?.forEach(exam => {
          if (exam.status === 'scheduled') {
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

    classes.forEach(classItem => {
      classItem.students?.forEach(student => {
        student.exams?.forEach(exam => {
          const examDate = new Date(exam.exam_date * 1000);
          examDate.setHours(0, 0, 0, 0);

          // Include if status is 'completed' OR exam date has passed
          if (exam.status === 'completed' || examDate.getTime() < today.getTime()) {
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
        <button
          onClick={handleBack}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali ke Daftar Kelas
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Semua Ujian</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar size={18} />
          <span>Ujian Mendatang</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'upcoming' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {upcomingExams.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'completed'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BookOpen size={18} />
          <span>Ujian Selesai</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'completed' ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {completedExams.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'upcoming' ? (
        <>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak ada ujian mendatang</h3>
              <p className="text-gray-500">Semua jadwal ujian sudah lewat atau belum ada yang dijadwalkan</p>
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
                      <div className="font-medium text-gray-900">{exam.studentName}</div>
                      <div className="text-sm text-gray-600">{exam.className}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Juz: {exam.juz_number || '-'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {exam.examiner_name ? (
                          <div className="text-xs text-gray-500">Penguji: {exam.examiner_name}</div>
                        ) : (
                          <div className="text-xs text-gray-500">Penguji: Ustadz Nawir</div>
                        )}
                        {exam.score !== null && (
                          <div className="text-xs font-medium text-blue-600">Nilai: {exam.score}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exam.exam_day}, {new Date(exam.exam_date * 1000).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.exam_period}
                      </div>
                      <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full inline-block">
                        {exam.exam_type === '5juz' ? '5 Juz' : 'Non 5 Juz'}
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum ada ujian selesai</h3>
              <p className="text-gray-500">Ujian yang sudah lewat atau selesai akan muncul di sini</p>
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
                      <div className="font-medium text-gray-900">{exam.studentName}</div>
                      <div className="text-sm text-gray-600">{exam.className}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Juz: {exam.juz_number || '-'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {exam.examiner_name ? (
                          <div className="text-xs text-gray-500">Penguji: {exam.examiner_name}</div>
                        ) : (
                          <div className="text-xs text-gray-500">Penguji: Ustadz Nawir</div>
                        )}
                        {exam.score !== null && (
                          <div className="text-sm font-medium text-green-600">Nilai: {exam.score}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exam.exam_day}, {new Date(exam.exam_date * 1000).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {exam.exam_period}
                      </div>
                      <div className="mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full inline-block">
                        {exam.exam_type === '5juz' ? '5 Juz' : 'Non 5 Juz'}
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
                <span className="text-sm font-medium text-gray-900">{selectedExam?.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kelas:</span>
                <span className="text-sm font-medium text-gray-900">{selectedExam?.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Juz:</span>
                <span className="text-sm font-medium text-gray-900">{selectedExam?.juz_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jadwal:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedExam?.exam_day}, {new Date(selectedExam?.exam_date * 1000).toLocaleDateString('id-ID')} - {selectedExam?.exam_period}
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
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default SemuaUjianPageWithRouting;