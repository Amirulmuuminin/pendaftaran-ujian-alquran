import React from "react";
import { Exam, scheduleDays, scheduleSlots } from "../../types";

interface ExamDatePickerProps {
  selectedDate?: string;
  onDateChange: (date: string) => void;
  examType: 'non-5juz' | '5juz';
  classSchedule?: string;
  existingExams?: Exam[];
  disabled?: boolean;
}

const ExamDatePicker: React.FC<ExamDatePickerProps> = ({
  selectedDate,
  onDateChange,
  examType,
  classSchedule,
  existingExams = [],
  disabled = false,
}) => {
  // Get next available dates based on exam type
  const getAvailableDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight

    const daysToShow = examType === '5juz' ? 10 : 5;
    const availableDates: Array<{date: Date, dateKey: string, availableSlots: number}> = [];

    for (let i = 1; i <= daysToShow; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);

      const dayName = futureDate.toLocaleDateString('id-ID', { weekday: 'long' });
      const dateKey = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if this day has available slots based on class schedule
      const availableSlots = getAvailableSlotsForDate(dayName, dateKey);

      // Only include dates that have available slots
      if (availableSlots > 0) {
        availableDates.push({
          date: futureDate,
          dateKey,
          availableSlots
        });
      }
    }

    return availableDates;
  };

  // Get available time slots for a specific date
  const getAvailableSlotsForDate = (dayName: string, dateKey: string) => {
    // Get class schedule for this day of week
    const classDaySchedule = getClassScheduleForDay(dayName);

    if (classDaySchedule.length === 0) {
      return 0; // No Quran classes on this day
    }

    // Filter by day constraints (Selasa & Rabu only have 4 periods)
    const maxPeriod = (dayName === 'Selasa' || dayName === 'Rabu') ? 4 : 5;
    const validPeriods = classDaySchedule.filter(slot => {
      const slotNumber = parseInt(slot.replace('Jam ke-', ''));
      return slotNumber <= maxPeriod;
    });

    // Check which periods are already booked on this specific date
    const bookedPeriods = existingExams
      .filter(exam => exam.exam_date_key === dateKey)
      .map(exam => exam.exam_period)
      .filter(Boolean);

    // Calculate available slots
    const availableSlots = validPeriods.filter(period => !bookedPeriods.includes(period));

    return availableSlots.length;
  };

  // Get class schedule for a specific day of week
  const getClassScheduleForDay = (dayName: string) => {
    if (!classSchedule) return [];

    try {
      const schedule = JSON.parse(classSchedule);
      const dayKey = dayName.toLowerCase();
      return schedule[dayKey] || [];
    } catch {
      return [];
    }
  };

  const availableDates = getAvailableDates();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSlotStatusText = (availableSlots: number) => {
    if (availableSlots <= 2) {
      return <span className="text-orange-600 text-xs">Tersedia {availableSlots} slot</span>;
    } else {
      return <span className="text-green-600 text-xs">Tersedia {availableSlots} slot</span>;
    }
  };

  // If no available dates, show appropriate message
  if (availableDates.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Tanggal Ujian
          <span className="text-xs text-gray-500 ml-2">
            (maksimal {examType === '5juz' ? '10' : '5'} hari ke depan)
          </span>
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-800 text-center">
            ❌ Tidak ada tanggal tersedia dalam {examType === '5juz' ? '10' : '5'} hari ke depan.
            <br />
            <span className="text-xs">
              Semua slot Al-Qur'an sudah terisi atau tidak ada jadwal kelas untuk hari-hari tersebut.
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pilih Tanggal Ujian
        <span className="text-xs text-gray-500 ml-2">
          (maksimal {examType === '5juz' ? '10' : '5'} hari ke depan)
        </span>
      </label>

      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {availableDates.map(({ date, dateKey, availableSlots }) => {
          const isSelected = selectedDate === dateKey;

          return (
            <label
              key={dateKey}
              className={`
                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                ${isSelected
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="exam-date"
                  value={dateKey}
                  checked={isSelected}
                  onChange={() => onDateChange(dateKey)}
                  disabled={disabled}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {date.toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
              {getSlotStatusText(availableSlots)}
            </label>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-2 text-xs text-blue-600">
          Tanggal dipilih: {formatDate(new Date(selectedDate + 'T00:00:00'))}
        </div>
      )}
    </div>
  );
};

export default ExamDatePicker;