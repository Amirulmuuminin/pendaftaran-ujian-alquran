import React, { useState, useEffect } from "react";
import { AvailableSlot, ExamSlotSelectorProps, SlotSelection } from "../../types";
import useDataStore from "../../store";
import { Loader2, Calendar, Clock } from "lucide-react";

const ExamSlotSelector: React.FC<ExamSlotSelectorProps> = ({
  selectedSlot,
  onSlotChange,
  examType,
  classSchedule,
  existingExams = [],
  disabled = false,
  classId,
  juzPortion,
  examinerId,
}) => {
  const { getNearestAvailableSlots, findClass } = useDataStore();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Get class ID with priority logic
  const getClassId = () => {
    // Priority 1: Use classId from props (most reliable)
    if (classId) {
      return classId;
    }

    // Priority 2: Fallback to existing exams (for backward compatibility)
    if (existingExams.length > 0) {
      return existingExams[0].class_id;
    }

    return null;
  };

  // Load available slots only when juzPortion is provided for non-5juz exams
  useEffect(() => {
    const loadSlots = async () => {
      // For non-5juz exams, wait for juzPortion to be selected
      if (examType === 'non-5juz' && !juzPortion) {
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      const effectiveClassId = classId || getClassId();
      if (!effectiveClassId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Pass current values to avoid stale closure
        const slots = await getNearestAvailableSlots(effectiveClassId, examType, undefined, juzPortion, examinerId);
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to load available slots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [examType, classId, juzPortion, examinerId]); // Reload when exam type, classId, juzPortion, or examinerId changes

  
  const handleSlotSelect = (slot: AvailableSlot) => {
    const selection: SlotSelection = {
      dateKey: slot.dateKey,
      period: slot.period,
      examinerId: slot.examinerId,
      examinerName: slot.examinerName,
    };
    onSlotChange(selection);
  };

  const getSlotStatusColor = (distance: number) => {
    if (distance <= 2) return "text-green-600"; // Very soon
    if (distance <= 5) return "text-blue-600"; // Soon
    return "text-gray-600"; // Later
  };

  const getSlotBgColor = (slot: AvailableSlot, isSelected: boolean) => {
    if (isSelected) {
      return "bg-blue-50 border-blue-500 hover:bg-blue-100";
    }
    if (slot.distance <= 2) {
      return "bg-green-50 border-green-200 hover:bg-green-100";
    }
    return "bg-white border-gray-200 hover:bg-gray-50";
  };

  // Show message when juzPortion is not selected for non-5juz exams
  if (examType === 'non-5juz' && !juzPortion) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Jadwal Ujian
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
          <div className="flex items-center text-blue-800">
            <Calendar className="w-5 h-5 mr-2" />
            <div>
              <p className="text-sm font-medium">Pilih jenis ujian terlebih dahulu</p>
              <p className="text-xs mt-1">
                Silakan pilih "1 Juz" atau "1/2 Juz" untuk melihat jadwal yang tersedia.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">Mencari jadwal tersedia...</span>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Jadwal Ujian
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
          <div className="flex items-center text-yellow-800">
            <Calendar className="w-5 h-5 mr-2" />
            <div>
              <p className="text-sm font-medium">Tidak ada jadwal tersedia</p>
              <p className="text-xs mt-1">
                Semua slot terisi dalam 30 hari ke depan. Silakan coba lagi nanti.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pilih Jadwal Ujian
        <span className="text-xs text-gray-500 ml-2">
          (5 tanggal berbeda terdekat yang tersedia)
        </span>
      </label>

      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {availableSlots.map((slot, index) => {
          const isSelected = selectedSlot?.dateKey === slot.dateKey && selectedSlot?.period === slot.period;

          return (
            <label
              key={`${slot.dateKey}-${slot.period}`}
              className={`
                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                ${getSlotBgColor(slot, isSelected)}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="exam-slot"
                  checked={isSelected}
                  onChange={() => handleSlotSelect(slot)}
                  disabled={disabled}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className={`text-sm font-medium text-gray-900`}>
                    {slot.displayText}
                  </div>
                  <div className={`text-xs ${getSlotStatusColor(slot.distance)}`}>
                    {slot.distance === 1 ? 'Besok' :
                     slot.distance === 2 ? 'Lusa' :
                     `${slot.distance} hari lagi`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {slot.dayName}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      
      {selectedSlot && (
        <div className="mt-2 text-xs text-blue-600">
          Dipilih: {availableSlots.find(s => s.dateKey === selectedSlot.dateKey && s.period === selectedSlot.period)?.displayText}
        </div>
      )}
    </div>
  );
};

export default ExamSlotSelector;