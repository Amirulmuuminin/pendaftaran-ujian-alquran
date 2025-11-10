import React, { useMemo } from "react";
import useDataStore from "../../store";
import { BookOpen, Calendar, User } from "lucide-react";

const SemuaUjianPage: React.FC = () => {
  const { classes, loading } = useDataStore();

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
            });
          }
        });
      });
    });

    return allExams.sort((a, b) => a.exam_date - b.exam_date);
  }, [classes, loading]);

  const examsByDate = useMemo(() => {
    return upcomingExams.reduce((acc, exam) => {
      const dateKey = new Date(exam.exam_date * 1000).toLocaleDateString('id-ID');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(exam);
      return acc;
    }, {} as Record<string, typeof upcomingExams>);
  }, [upcomingExams]);

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
        <h2 className="text-2xl font-bold text-gray-900">Semua Ujian</h2>
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <BookOpen size={16} className="mr-2" />
          <span>Total {upcomingExams.length} ujian akan datang</span>
        </div>
      </div>

      {upcomingExams.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Belum Ada Ujian
          </h3>
          <p className="text-gray-500">
            Belum ada ujian yang dijadwalkan untuk semua kelas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(examsByDate)
            .map(([date, exams]) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center space-x-2">
                  <Calendar size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {date}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({(exams as typeof upcomingExams).length} ujian)
                  </span>
                </div>

                {/* Exams for this date */}
                <div className="space-y-3 pl-6">
                  {(exams as typeof upcomingExams).map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {exam.exam_type === '5juz' ? `Ujian 5 Juz (${exam.juz_number})` : exam.juz_number || 'Ujian'}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              exam.exam_type === '5juz'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {exam.exam_type === '5juz' ? '5 Juz' : 'Non 5 Juz'}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User size={14} className="mr-2 text-gray-400" />
                              <span>
                                <span className="font-medium">{exam.studentName}</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span>{exam.className}</span>
                              </span>
                            </div>
                            {exam.notes && (
                              <div className="text-gray-500">
                                Catatan: {exam.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SemuaUjianPage;