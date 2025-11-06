import React from "react";
import { Student, Exam } from "../../types";
import { Button } from "../ui";
import { Calendar, Edit, Trash2, X, BookOpen } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onAddExam: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteExam: (examId: string) => Promise<void>;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onAddExam,
  onEditStudent,
  onDeleteStudent,
  onDeleteExam,
}) => {
  const exams = student.exams || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
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
            <Calendar size={16} className="text-green-600" />
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
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            Ujian ({exams.length})
          </p>
        </div>
        {exams.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            Belum ada ujian yang didaftarkan
          </p>
        ) : (
          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {exam.exam_type === '5juz' ? `5 Juz (${exam.juz_number})` : `Juz ${exam.juz_number || '?'}`}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      exam.exam_type === '5juz'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {exam.exam_type === '5juz' ? '5J' : 'NJ'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {exam.exam_date_key && exam.exam_period ? (
                      <>
                        {new Date(exam.exam_date_key + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}, {exam.exam_period}
                        {exam.notes && ` • ${exam.notes}`}
                      </>
                    ) : exam.exam_day && exam.exam_period ? (
                      <>
                        {exam.exam_day}, {exam.exam_period}
                        {exam.notes && ` • ${exam.notes}`}
                      </>
                    ) : (
                      <>
                        {new Date(exam.exam_date * 1000).toLocaleDateString('id-ID')}
                        {exam.notes && ` • ${exam.notes}`}
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteExam(exam.id)}
                  className="ml-2 p-1 rounded hover:bg-red-100 transition-colors"
                  title="Hapus Ujian"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCard;