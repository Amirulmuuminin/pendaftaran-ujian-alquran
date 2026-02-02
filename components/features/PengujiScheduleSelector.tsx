"use client";
import React from "react";
import { DAYS_OF_WEEK, TIME_SLOT_LABELS } from "../../types/constants";

interface PengujiScheduleSelectorProps {
  schedule: string;
  onScheduleChange: (schedule: string) => void;
}

export const PengujiScheduleSelector: React.FC<PengujiScheduleSelectorProps> = ({
  schedule,
  onScheduleChange,
}) => {
  const [localSchedule, setLocalSchedule] = React.useState<Record<string, string[]>>(() => {
    try {
      return schedule ? JSON.parse(schedule) : {};
    } catch {
      return {};
    }
  });

  const handleSlotToggle = (day: string, slot: string) => {
    const dayLower = day.toLowerCase();
    const updated = { ...localSchedule };

    if (!updated[dayLower]) {
      updated[dayLower] = [];
    }

    if (updated[dayLower].includes(slot)) {
      updated[dayLower] = updated[dayLower].filter(s => s !== slot);
    } else {
      updated[dayLower] = [...updated[dayLower], slot];
    }

    setLocalSchedule(updated);
    onScheduleChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day) => {
        const dayLower = day.toLowerCase();
        const selectedSlots = localSchedule[dayLower] || [];

        return (
          <div key={day} className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{day}</h4>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOT_LABELS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotToggle(day, slot)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedSlots.includes(slot)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PengujiScheduleSelector;
