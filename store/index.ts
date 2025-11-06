"use client";
import { create } from 'zustand';
import { ClassData, Exam, DataContextType, AvailableSlot } from '../types';
import client from '../lib/db';

interface DataStore extends DataContextType {
  loadData: () => Promise<void>;
  getNearestAvailableSlots: (classId: string, examType: 'non-5juz' | '5juz', limit?: number) => Promise<AvailableSlot[]>;
  getAvailableSlotsForDateRange: (classId: string, startDate: string, endDate: string) => Promise<AvailableSlot[]>;
  getClassScheduleForDay: (classSchedule: string, dayName: string) => string[];
}

const useDataStore = create<DataStore>((set, get) => ({
  classes: [],
  loading: true,
  error: null,

  loadData: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch classes
      const classesResult = await client.execute(
        "SELECT * FROM classes ORDER BY name"
      );

      // Fetch students
      const studentsResult = await client.execute(
        "SELECT * FROM students ORDER BY name"
      );

      // Fetch exams
      const examsResult = await client.execute(
        "SELECT * FROM exams ORDER BY exam_date"
      );

      // Process data into ClassData format
      const classesData: ClassData[] = classesResult.rows.map(
        (classRow: any) => {
          const classId = classRow.id as string;
          const classStudents = studentsResult.rows
            .filter((student: any) => student.class_id === classId)
            .map((student: any) => ({
              id: student.id as string,
              class_id: student.class_id as string,
              name: student.name as string,
              created_at: student.created_at as number,
              updated_at: student.updated_at as number,
              exams: examsResult.rows
                .filter((exam: any) => exam.student_id === student.id)
                .map((exam: any) => ({
                  id: exam.id as string,
                  student_id: exam.student_id as string,
                  class_id: exam.class_id as string,
                  exam_date: exam.exam_date as number,
                  exam_date_key: exam.exam_date_key as string | undefined,
                  status: exam.status as string,
                  score: exam.score as number | undefined,
                  juz_number: exam.juz_number as string | undefined,
                  exam_type: exam.exam_type as "non-5juz" | "5juz",
                  notes: exam.notes as string | undefined,
                  exam_day: exam.exam_day as string | undefined,
                  exam_period: exam.exam_period as string | undefined,
                  created_at: exam.created_at as number,
                  updated_at: exam.updated_at as number,
                })),
            }));

          return {
            id: classId,
            name: classRow.name as string,
            schedule: classRow.schedule as string,
            students: classStudents,
            created_at: classRow.created_at as number,
            updated_at: classRow.updated_at as number,
          };
        }
      );

      set({ classes: classesData, loading: false });
    } catch (err) {
      console.error("Failed to load data from Turso:", err);
      set({ error: "Failed to load data. Check console.", loading: false });
    }
  },

  findClass: (classId: string) => {
    const { classes } = get();
    return classes.find((c) => c.id === classId);
  },

  addClass: async (classData: Omit<ClassData, "id" | "students" | "created_at" | "updated_at">) => {
    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "INSERT INTO classes (id, name, schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, classData.name, classData.schedule, now, now],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to add class:", err);
      set({ error: "Failed to add class" });
    }
  },

  updateClass: async (classId: string, updatedData: Partial<ClassData>) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      const fields = [];
      const values = [];

      if (updatedData.name !== undefined) {
        fields.push("name = ?");
        values.push(updatedData.name);
      }
      if (updatedData.schedule !== undefined) {
        fields.push("schedule = ?");
        values.push(updatedData.schedule);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(classId);

      await client.execute({
        sql: `UPDATE classes SET ${fields.join(", ")} WHERE id = ?`,
        args: values,
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to update class:", err);
      set({ error: "Failed to update class" });
    }
  },

  deleteClass: async (classId: string) => {
    try {
      await client.execute({
        sql: "DELETE FROM exams WHERE class_id = ?",
        args: [classId],
      });

      await client.execute({
        sql: "DELETE FROM students WHERE class_id = ?",
        args: [classId],
      });

      await client.execute({
        sql: "DELETE FROM classes WHERE id = ?",
        args: [classId],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to delete class:", err);
      set({ error: "Failed to delete class" });
    }
  },

  addStudent: async (classId: string, studentName: string) => {
    const id = `student_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "INSERT INTO students (id, class_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, classId, studentName, now, now],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to add student:", err);
      set({ error: "Failed to add student" });
    }
  },

  updateStudent: async (classId: string, studentId: string, newName: string) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "UPDATE students SET name = ?, updated_at = ? WHERE id = ?",
        args: [newName, now, studentId],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to update student:", err);
      set({ error: "Failed to update student" });
    }
  },

  deleteStudent: async (classId: string, studentId: string) => {
    try {
      await client.execute({
        sql: "DELETE FROM exams WHERE student_id = ?",
        args: [studentId],
      });

      await client.execute({
        sql: "DELETE FROM students WHERE id = ?",
        args: [studentId],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to delete student:", err);
      set({ error: "Failed to delete student" });
    }
  },

  addExam: async (classId: string, studentId: string, examData: Omit<Exam, "id" | "created_at" | "updated_at">) => {
    const id = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "INSERT INTO exams (id, student_id, class_id, exam_date, exam_date_key, status, score, juz_number, exam_type, notes, exam_day, exam_period, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          studentId,
          classId,
          examData.exam_date,
          examData.exam_date_key || null,
          examData.status,
          examData.score || null,
          examData.juz_number || null,
          examData.exam_type,
          examData.notes || null,
          examData.exam_day || null,
          examData.exam_period || null,
          now,
          now,
        ],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to add exam:", err);
      set({ error: "Failed to add exam" });
    }
  },

  // New function to check date conflicts
  checkDateConflict: async (classId: string, dateKey: string, period: string) => {
    try {
      const result = await client.execute({
        sql: "SELECT COUNT(*) as count FROM exams WHERE class_id = ? AND exam_date_key = ? AND exam_period = ?",
        args: [classId, dateKey, period],
      });

      return result.rows[0].count > 0;
    } catch (err) {
      console.error("Failed to check date conflict:", err);
      return false;
    }
  },

  // New function to get all exams for a class on a specific date
  getExamsByDate: async (classId: string, dateKey: string) => {
    try {
      const result = await client.execute({
        sql: "SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ? ORDER BY exam_period",
        args: [classId, dateKey],
      });

      return result.rows;
    } catch (err) {
      console.error("Failed to get exams by date:", err);
      return [];
    }
  },

  deleteExam: async (classId: string, studentId: string, examId: string) => {
    try {
      await client.execute({
        sql: "DELETE FROM exams WHERE id = ?",
        args: [examId],
      });

      await get().loadData();
    } catch (err) {
      console.error("Failed to delete exam:", err);
      set({ error: "Failed to delete exam" });
    }
  },

  // Helper function to get class schedule for a specific day
  getClassScheduleForDay: (classSchedule: string, dayName: string) => {
    if (!classSchedule) return [];

    try {
      const schedule = JSON.parse(classSchedule);
      const dayKey = dayName.toLowerCase();
      return schedule[dayKey] || [];
    } catch {
      return [];
    }
  },

  // Get available slots for a specific date range
  getAvailableSlotsForDateRange: async (classId: string, startDate: string, endDate: string) => {
    try {
      // Get class data
      const classData = get().findClass(classId);
      if (!classData) return [];

      // Get all exams in the date range
      const examsResult = await client.execute({
        sql: "SELECT * FROM exams WHERE class_id = ? AND exam_date_key BETWEEN ? AND ? ORDER BY exam_date_key, exam_period",
        args: [classId, startDate, endDate],
      });

      const existingExams = examsResult.rows;

      // Generate available slots for each day in range
      const availableSlots: AvailableSlot[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayName = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });

        // Get class schedule for this day
        const classDaySchedule = get().getClassScheduleForDay(classData.schedule, dayName);
        if (classDaySchedule.length === 0) continue;

        // Apply day constraints (Selasa & Rabu only have 4 periods)
        const maxPeriod = (dayName === 'Selasa' || dayName === 'Rabu') ? 4 : 5;
        const validPeriods = classDaySchedule.filter(slot => {
          const slotNumber = parseInt(slot.replace('Jam ke-', ''));
          return slotNumber <= maxPeriod;
        });

        // Find which periods are already booked
        const bookedPeriods = existingExams
          .filter(exam => exam.exam_date_key === dateKey)
          .map(exam => exam.exam_period)
          .filter(Boolean);

        // Generate available slots for this day
        for (const period of validPeriods) {
          if (!bookedPeriods.includes(period)) {
            const slotDate = new Date(currentDate);
            const distance = Math.ceil((slotDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));

            availableSlots.push({
              date: slotDate,
              dateKey,
              period,
              dayName,
              displayText: `${dayName}, ${slotDate.getDate()} ${slotDate.toLocaleDateString('id-ID', { month: 'short' })} - ${period.replace('Jam ke-', 'Jam ')}`,
              distance
            });
          }
        }
      }

      return availableSlots.sort((a, b) => a.distance - b.distance);
    } catch (err) {
      console.error("Failed to get available slots for date range:", err);
      return [];
    }
  },

  // Get slots from 5 different nearest dates (not consecutive)
  getNearestAvailableSlots: async (classId: string, examType: 'non-5juz' | '5juz', limit?: number) => {
    try {
      const targetDates = examType === '5juz' ? 10 : 5;
      const maxSearchDays = 30;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allSlots: AvailableSlot[] = [];
      const datesWithSlots = new Set<string>();

      // Search day by day until we find targetDates with slots or reach maxSearchDays
      for (let dayOffset = 1; dayOffset <= maxSearchDays; dayOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const dateKey = checkDate.toISOString().split('T')[0];

        // Check if we already have slots for this date
        if (datesWithSlots.has(dateKey)) continue;

        // Get slots for this single date
        const daySlots = await get().getAvailableSlotsForDateRange(
          classId,
          dateKey,
          dateKey
        );

        // If this date has available slots, add all slots from this date
        if (daySlots.length > 0) {
          allSlots.push(...daySlots);
          datesWithSlots.add(dateKey);

          // Stop if we've found enough different dates
          if (datesWithSlots.size >= targetDates) {
            break;
          }
        }
      }

      // Sort all slots by date (not by distance) to maintain chronological order
      return allSlots.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (err) {
      console.error("Failed to get nearest available slots:", err);
      return [];
    }
  },
}));

export default useDataStore;