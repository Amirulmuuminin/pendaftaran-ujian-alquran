import React from "react";
import { Student, Exam } from "../../types";
import { Button } from "../ui";
import { Plus, Edit, Trash2, BookOpen, Award, UserCheck } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onAddExam: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteExam: (examId: string) => Promise<void>;
  onEditExam?: (exam: Exam) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onAddExam,
  onEditStudent,
  onDeleteStudent,
  onDeleteExam,
  onEditExam,
}) => {
  const exams = student.exams || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md">
      {/* Student Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {student.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Terdaftar: {new Date(student.created_at * 1000).toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onAddExam(student)}
            className="p-2 rounded-lg hover:bg-green-50 transition-colors"
            title="Tambah Ujian"
          >
            <Plus size={16} className="text-green-600" />
          </button>
          <button
            onClick={() => onEditStudent(student)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit Murid"
          >
            <Edit size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => onDeleteStudent(student.id)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Hapus Murid"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Student's Exam List */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Ujian ({exams.length})
        </p>
        {exams.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">
            Belum ada ujian yang didaftarkan
          </p>
        ) : (
          <div className="space-y-2">
            {exams.map((exam) => {
              const hasScore = exam.score !== null && exam.score !== undefined && exam.score !== '';
              const scoreValue = exam.score;

              return (
                <div
                  key={exam.id}
                  className={`rounded-lg p-3 border transition-all ${
                    hasScore
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Exam Info */}
                    <div className="flex-1 min-w-0">
                      {/* Exam Type & Juz */}
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">
                          {exam.exam_type === '5juz' ? `5 Juz (${exam.juz_number})` : exam.juz_number || '?'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          exam.exam_type === '5juz'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {exam.exam_type === '5juz' ? '5J' : 'NJ'}
                        </span>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>
                          {exam.exam_date_key && exam.exam_period ? (
                            <span>
                              {new Date(exam.exam_date_key + 'T00:00:00').toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })} • {exam.exam_period}
                            </span>
                          ) : exam.exam_day && exam.exam_period ? (
                            <span>{exam.exam_day} • {exam.exam_period}</span>
                          ) : (
                            <span>{new Date(exam.exam_date * 1000).toLocaleDateString('id-ID')}</span>
                          )}
                        </span>
                        {exam.notes && <span className="text-gray-500">• {exam.notes}</span>}
                      </div>

                      {/* Examiner Name with badge */}
                      {exam.examiner_name && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <UserCheck size={11} className="text-indigo-500" />
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {exam.examiner_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Score Display */}
                    {hasScore && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1.5 border-2 border-green-300 shadow-sm">
                          <Award size={12} className="text-green-600" />
                          <span className="text-sm font-bold text-green-700">
                            {scoreValue}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {onEditExam && (
                        <button
                          onClick={() => onEditExam(exam)}
                          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                          title="Edit Jadwal"
                        >
                          <Edit size={14} className="text-blue-500" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                        title="Hapus Ujian"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCard;
