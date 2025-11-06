import React, { useState, useEffect } from "react";
import { AvailableSlot, MultiSlotSelectorProps, SlotSelection } from "../../types";
import useDataStore from "../../store";
import { Loader2, Calendar, Clock, BookOpen } from "lucide-react";

const MultiSlotSelector: React.FC<MultiSlotSelectorProps> = ({
  selectedSlots,
  onSlotsChange,
  requiredCount,
  examType,
  classSchedule,
  existingExams = [],
  disabled = false,
    classId,
}) => {
  const { getNearestAvailableSlots } = useDataStore();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableSlots();
  }, [examType, classId]); // Only reload when exam type or classId changes

  const loadAvailableSlots = async () => {
    // Priority logic for getting class ID
    const effectiveClassId = classId || (existingExams.length > 0 ? existingExams[0].class_id : null);
    if (!effectiveClassId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const slots = await getNearestAvailableSlots(effectiveClassId, examType);
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to load available slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = (slot: AvailableSlot, index: number) => {
    const newSelection = { dateKey: slot.dateKey, period: slot.period };
    const newSlots = [...selectedSlots];

    if (isSlotSelected(slot)) {
      // Remove slot if already selected
      const slotIndex = newSlots.findIndex(s => s.dateKey === slot.dateKey && s.period === slot.period);
      if (slotIndex > -1) {
        newSlots[slotIndex] = { dateKey: "", period: "" };
      }
    } else {
      // Add/update slot
      newSlots[index] = newSelection;
    }

    onSlotsChange(newSlots);
  };

  const isSlotSelected = (slot: AvailableSlot) => {
    return selectedSlots.some(s => s.dateKey === slot.dateKey && s.period === slot.period);
  };

  const getSlotStatusColor = (distance: number) => {
    if (distance <= 2) return "text-green-600";
    if (distance <= 5) return "text-blue-600";
    return "text-gray-600";
  };

  const getSlotBgColor = (slot: AvailableSlot, isSelected: boolean, slotIndex: number) => {
    if (isSelected) {
      return "bg-blue-50 border-blue-500 hover:bg-blue-100";
    }
    if (slot.distance <= 2) {
      return "bg-green-50 border-green-200 hover:bg-green-100";
    }
    return "bg-white border-gray-200 hover:bg-gray-50";
  };

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
          Pilih Jadwal Ujian (5 hari berbeda)
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
        Pilih Jadwal Ujian (5 tanggal berbeda)
        <span className="text-xs text-gray-500 ml-2">
          (Pilih {requiredCount} slot dari {availableSlots.length} slot tersedia)
        </span>
      </label>

      <div className="space-y-3">
        {Array.from({ length: requiredCount }, (_, index) => {
          const selectedSlot = selectedSlots[index];
          const selectedSlotInfo = selectedSlot?.dateKey ?
            availableSlots.find(s => s.dateKey === selectedSlot.dateKey && s.period === selectedSlot.period) : null;

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center mb-2">
                <BookOpen className="w-4 h-4 text-purple-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">
                  Juz {index + 1}
                </h4>
                {selectedSlotInfo && (
                  <span className="ml-auto text-xs text-blue-600">
                    Dipilih: {selectedSlotInfo.displayText}
                  </span>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableSlots.map((slot) => {
                  const isSelected = isSlotSelected(slot);
                  const isDisabled = disabled || isSlotSelected(slot) && !isSelected;

                  return (
                    <label
                      key={`${slot.dateKey}-${slot.period}-${index}`}
                      className={`
                        flex items-center justify-between p-2 rounded border cursor-pointer transition-colors text-sm
                        ${getSlotBgColor(slot, isSelected, index)}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`juz-slot-${index}`}
                          checked={isSelected}
                          onChange={() => handleSlotToggle(slot, index)}
                          disabled={isDisabled}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {slot.displayText}
                          </div>
                          <div className={`text-xs ${getSlotStatusColor(slot.distance)}`}>
                            {slot.distance === 1 ? 'Besok' :
                             slot.distance === 2 ? 'Lusa' :
                             `${slot.distance} hari lagi`}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-500">
                            {slot.dayName.substring(0, 3)}
                          </span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Slot terpilih: {selectedSlots.filter(s => s.dateKey).length}/{requiredCount}</span>
          <span>Slot tersedia: {availableSlots.length}</span>
        </div>
        {selectedSlots.filter(s => s.dateKey).length < requiredCount && (
          <p className="text-orange-600 mt-1">
            Silakan pilih {requiredCount - selectedSlots.filter(s => s.dateKey).length} jadwal lagi.
          </p>
        )}
      </div>
    </div>
  );
};

export default MultiSlotSelector;