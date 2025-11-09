"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ClassData } from "../../types";
import { Button } from "../ui";
import { Users, BookOpen, Edit, Trash2, Clock } from "lucide-react";

interface ClassCardWithRoutingProps {
  classItem: ClassData;
  onEdit: (classItem: ClassData) => void;
  onDelete: (classId: string) => void;
}

const ClassCardWithRouting: React.FC<ClassCardWithRoutingProps> = ({
  classItem,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();

  // Parse schedule from JSON string
  let scheduleData = {};
  let scheduleCount = 0;
  try {
    scheduleData = JSON.parse(classItem.schedule);
    scheduleCount = Object.values(scheduleData).flat().length;
  } catch {
    // Handle legacy schedule format
    scheduleCount = 1;
  }

  const handleViewDetail = () => {
    router.push(`/detail-kelas?id=${classItem.id}`);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer"
      onClick={handleViewDetail}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {classItem.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Dibuat: {new Date(classItem.created_at * 1000).toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(classItem)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(classItem.id)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Users size={16} className="mr-2 text-blue-500" />
          <span>{classItem.students.length} Murid Terdaftar</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={16} className="mr-2 text-blue-500" />
          <span>{scheduleCount} Jam Qur'an per Minggu</span>
        </div>
        {scheduleCount > 0 && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">
            <div className="font-medium mb-1">Jadwal:</div>
            <div className="whitespace-pre-line">
              {scheduleCount} jam pelajaran per minggu
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCardWithRouting;