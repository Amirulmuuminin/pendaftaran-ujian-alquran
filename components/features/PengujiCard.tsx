"use client";
import React from "react";
import { Penguji } from "../../types";
import { Edit, Trash2, User, Calendar } from "lucide-react";

interface PengujiCardProps {
  penguji: Penguji;
  onEdit: (penguji: Penguji) => void;
  onDelete: (pengujiId: string) => void;
}

export const PengujiCard: React.FC<PengujiCardProps> = ({ penguji, onEdit, onDelete }) => {
  const scheduleSummary = React.useMemo(() => {
    try {
      const schedule = JSON.parse(penguji.schedule);
      const days = Object.entries(schedule)
        .filter(([_, slots]: [string, any]) => slots.length > 0)
        .map(([day, slots]: [string, any]) => {
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          return `${dayName}: ${slots.join(', ')}`;
        });
      return days.length > 0 ? days : ['Tidak ada jadwal'];
    } catch {
      return ['Jadwal tidak valid'];
    }
  }, [penguji.schedule]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{penguji.name}</h3>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => onEdit(penguji)} className="p-2 rounded-lg hover:bg-gray-100">
            <Edit size={16} className="text-gray-600" />
          </button>
          <button onClick={() => onDelete(penguji.id)} className="p-2 rounded-lg hover:bg-red-50">
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </div>
      <div className="flex items-start gap-2 text-sm text-gray-600">
        <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          {scheduleSummary.map((day, idx) => (
            <div key={idx} className="text-xs">{day}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PengujiCard;
