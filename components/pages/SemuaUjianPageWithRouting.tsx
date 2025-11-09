"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import useDataStore from "../../store";
import { BookOpen, Calendar, User, ArrowLeft } from "lucide-react";

const SemuaUjianPageWithRouting: React.FC = () => {
  const router = useRouter();
  const { classes, loading } = useDataStore();

  const handleBack = () => {
    router.push("/");
  };

  const upcomingExams = useMemo(() => {
    if (loading) return [];

    const allExams: any[] = [];

    classes.forEach(classItem => {
      classItem.students?.forEach(student => {
        student.exams?.forEach(exam => {
          if (exam.status === 'scheduled') {
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

    // Sort by exam date
    return allExams.sort((a, b) => a.exam_date - b.exam_date);
  }, [classes, loading]);

  const completedExams = useMemo(() => {
    if (loading) return [];

    const allExams: any[] = [];

    classes.forEach(classItem => {
      classItem.students?.forEach(student => {
        student.exams?.forEach(exam => {
          if (exam.status === 'completed') {
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

    // Sort by completion date (most recent first)
    return allExams.sort((a, b) => b.updated_at - a.updated_at);
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

      {/* Upcoming Exams */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="mr-2 text-blue-600" size={20} />
          Ujian Mendatang ({upcomingExams.length})
        </h3>
        {upcomingExams.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Tidak ada ujian mendatang</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{exam.studentName}</div>
                    <div className="text-sm text-gray-600">{exam.className}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Juz: {exam.juz_number || '-'}
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
      </div>

      {/* Completed Exams */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BookOpen className="mr-2 text-green-600" size={20} />
          Ujian Selesai ({completedExams.length})
        </h3>
        {completedExams.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Belum ada ujian yang selesai</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{exam.studentName}</div>
                    <div className="text-sm text-gray-600">{exam.className}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Juz: {exam.juz_number || '-'}
                    </div>
                    {exam.score !== null && (
                      <div className="text-sm font-medium text-green-600 mt-1">
                        Nilai: {exam.score}/100
                      </div>
                    )}
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
      </div>
    </div>
  );
};

export default SemuaUjianPageWithRouting;