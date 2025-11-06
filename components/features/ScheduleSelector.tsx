import React, { useState, useCallback } from "react";
import { DAYS_OF_WEEK, TIME_SLOT_LABELS, TIME_SLOT_COUNT, DEFAULT_SCHEDULE } from "../../types/constants";

interface ScheduleSelectorProps {
  initialSchedule?: Record<string, string[]>;
  onScheduleChange: (schedule: Record<string, string[]>) => void;
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  initialSchedule = DEFAULT_SCHEDULE,
  onScheduleChange,
}) => {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [errorMessage, setErrorMessage] = useState("");

  const handleToggleSlot = useCallback((dayKey: string, dayLabel: string, index: number) => {
    setSchedule((prev) => {
      const currentSlots = (prev as Record<string, string[]>)[dayKey] || Array(TIME_SLOT_COUNT).fill("");
      const isSelected = currentSlots[index] !== "";
      const selectedCount = currentSlots.filter((s) => s !== "").length;

      let newSlots = [...currentSlots];
      let newError = "";

      if (isSelected) {
        // Unselecting: Must maintain minimum 2 selected slots
        if (selectedCount > 2) {
          newSlots[index] = "";
        } else {
          newError = `Minimal harus memilih 2 jam pelajaran untuk ${dayLabel}.`;
        }
      } else {
        // Selecting: Cannot exceed maximum 3 selected slots
        if (selectedCount < 3) {
          newSlots[index] = TIME_SLOT_LABELS[index];
        } else {
          newError = `Maksimal hanya boleh memilih 3 jam pelajaran untuk ${dayLabel}.`;
        }
      }

      if (newError) {
        setErrorMessage(newError);
        return prev;
      }

      setErrorMessage("");
      const newSchedule = { ...prev, [dayKey]: newSlots };
      onScheduleChange(newSchedule);
      return newSchedule;
    });
  }, [onScheduleChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS_OF_WEEK.map((dayLabel) => {
          const dayKey = dayLabel.toLowerCase();
          const slots = (schedule as Record<string, string[]>)[dayKey] || Array(TIME_SLOT_COUNT).fill("");
          const selectedCount = slots.filter((s) => s !== "").length;

          return (
            <div
              key={dayKey}
              className="border p-3 rounded-xl bg-gray-50 shadow-sm"
            >
              <span className="font-bold text-gray-700 block mb-3">
                {dayLabel}
              </span>

              <div className="flex flex-wrap gap-2 mb-3">
                {TIME_SLOT_LABELS.map((label, index) => {
                  const isSelected = slots[index] !== "";
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleSlot(dayKey, dayLabel, index)}
                      className={`px-3 py-1 text-sm font-medium rounded-full transition-colors
                                  ${
                                    isSelected
                                      ? "bg-blue-600 text-white shadow-md"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }
                                  ${
                                    (selectedCount > 3 || selectedCount < 2) &&
                                    isSelected
                                      ? "ring-2 ring-red-400"
                                      : ""
                                  }
                                  ${
                                    selectedCount === 3 && !isSelected
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                              `}
                      disabled={!isSelected && selectedCount >= 3}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {selectedCount === 0 && (
                <p className="text-sm text-gray-500 pt-2 border-t border-gray-200">
                  Pilih minimal 2 jam di atas.
                </p>
              )}
              {selectedCount > 0 && (
                <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                  Terpilih:{" "}
                  <span className="font-semibold">
                    {slots.filter((s) => s !== "").join(", ")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="bg-red-100 p-3 rounded-xl text-red-700 text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ScheduleSelector;