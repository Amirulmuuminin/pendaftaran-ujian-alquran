import React from "react";
import { Exam } from "../../types";

interface ExamCardProps {
  exam: Exam;
  onDelete: (examId: string) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onDelete }) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900 truncate">
            {exam.exam_type === '5juz' ? `Ujian 5 Juz (${exam.juz_number})` : `Juz ${exam.juz_number || '?'}`}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            exam.exam_type === '5juz'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {exam.exam_type === '5juz' ? '5 Juz' : 'Non 5 Juz'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(exam.exam_date * 1000).toLocaleDateString('id-ID')}
          {exam.notes && ` • ${exam.notes}`}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(exam.id)}
          className="ml-3 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
          title="Hapus Ujian"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ExamCard;