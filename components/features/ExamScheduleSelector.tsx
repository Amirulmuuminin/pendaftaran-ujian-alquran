import React from "react";
import { scheduleDays, scheduleSlots } from "../../types";
import { Exam } from "../../types";

interface ExamScheduleSelectorProps {
  selectedDay?: string;
  selectedPeriod?: string;
  onDayChange: (day: string) => void;
  onPeriodChange: (period: string) => void;
  availablePeriods?: string[];
  disabled?: boolean;
  existingExams?: Exam[];
  classSchedule?: string;
  excludeSchedules?: Array<{day?: string, period?: string}>; // For 5 juz conflict detection
  selectedDate?: string; // New prop for date-based scheduling
}

const ExamScheduleSelector: React.FC<ExamScheduleSelectorProps> = ({
  selectedDay,
  selectedPeriod,
  onDayChange,
  onPeriodChange,
  availablePeriods,
  disabled = false,
  existingExams = [],
  classSchedule,
  excludeSchedules = [],
  selectedDate,
}) => {
  // Get periods that are already booked for a specific date
  const getBookedPeriods = (dateKey: string) => {
    if (!dateKey) return [];

    const examBookings = existingExams
      .filter(exam => exam.exam_date_key === dateKey)
      .map(exam => exam.exam_period)
      .filter(Boolean);

    // Add schedules from other juz selections (for 5 juz form)
    const otherJuzBookings = excludeSchedules
      .filter(schedule => schedule.period)
      .map(schedule => schedule.period!);

    return [...examBookings, ...otherJuzBookings];
  };

  // Get day name from selected date
  const getDayNameFromDate = () => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  // Get class schedule for a specific day
  const getClassScheduleForDay = (day: string) => {
    if (!classSchedule) return [];
    try {
      const schedule = JSON.parse(classSchedule);
      return schedule[day.toLowerCase()] || [];
    } catch {
      return [];
    }
  };

  // Get available periods for the selected date
  const getAvailablePeriodsForDate = () => {
    if (!selectedDate) return [];

    const dayName = getDayNameFromDate();
    if (!dayName) return [];

    const allPeriods = scheduleSlots;

    // Filter by day constraints (Selasa & Rabu only have 4 periods)
    const dayPeriods = (dayName === 'Selasa' || dayName === 'Rabu')
      ? allPeriods.slice(0, 4)
      : allPeriods;

    // Filter by class schedule (only allow Al-Qur'an periods)
    const classPeriods = getClassScheduleForDay(dayName);
    const allowedPeriods = classPeriods.length > 0
      ? dayPeriods.filter(period => classPeriods.includes(period.label))
      : dayPeriods;

    // Filter out already booked periods for this specific date
    const bookedPeriods = getBookedPeriods(selectedDate);
    const availablePeriods = allowedPeriods.filter(period => !bookedPeriods.includes(period.label));

    return availablePeriods;
  };

  const currentDayPeriods = getAvailablePeriodsForDate();
  const displayPeriods = availablePeriods || currentDayPeriods.map(p => p.label);
  const bookedPeriods = selectedDate ? getBookedPeriods(selectedDate) : [];
  const currentDayName = getDayNameFromDate();
  const classPeriods = currentDayName ? getClassScheduleForDay(currentDayName) : [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jam Pelajaran
          {currentDayName && (
            <span className="text-xs text-gray-500 ml-2">
              ({currentDayName}, {selectedDate})
            </span>
          )}
        </label>
        <select
          value={selectedPeriod || ''}
          onChange={(e) => onPeriodChange(e.target.value)}
          disabled={disabled || !selectedDate}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Pilih Jam</option>
          {currentDayPeriods
            .filter(period => displayPeriods.includes(period.label))
            .map((period) => (
              <option key={period.value} value={period.label}>
                {period.label}
              </option>
            ))}
        </select>
        {!selectedDate && (
          <p className="text-xs text-gray-500 mt-1">Pilih tanggal terlebih dahulu</p>
        )}
        {selectedDate && (currentDayName === 'Selasa' || currentDayName === 'Rabu') && (
          <p className="text-xs text-blue-600 mt-1">
            Hanya tersedia 4 jam pelajaran
          </p>
        )}
        {selectedDate && classPeriods.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            Jadwal Al-Qur'an: {classPeriods.join(', ')}
          </p>
        )}
        {selectedDate && bookedPeriods.length > 0 && (
          <p className="text-xs text-red-600 mt-1">
            Sudah terisi: {bookedPeriods.join(', ')}
          </p>
        )}
        {selectedDate && currentDayPeriods.length === 0 && (
          <p className="text-xs text-orange-600 mt-1">
            Tidak ada jam tersedia untuk tanggal ini
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamScheduleSelector;