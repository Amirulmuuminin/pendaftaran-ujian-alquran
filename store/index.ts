"use client";
import { create } from 'zustand';
import { ClassData, Exam, DataContextType, AvailableSlot } from '../types';
import { HALF_JUZ_SUFFIX } from '../types/constants';
import client from '../lib/db';

// Helper function untuk mendeteksi apakah ujian adalah 1/2 juz
// Mendeteksi: (1) teks yang berakhiran dengan "- 1/2 juz", atau (2) mengandung "1/2" atau "½" TANPA diikuti langsung oleh "juz"
const isHalfJuz = (juzNumber: any): boolean => {
  if (!juzNumber) return false;
  const text = String(juzNumber).trim();

  // Cek 1: Jika berakhiran dengan suffix "- 1/2 juz" atau variasinya
  if (text.endsWith('- 1/2 juz') || text.endsWith('-½ juz') || text.endsWith(HALF_JUZ_SUFFIX.trim())) {
    return true;
  }

  // Cek 2: Cari pola "1/2" atau "½" yang TIDAK diikuti langsung oleh "juz"
  // Pattern: mencocokkan "1/2" atau "½" yang diikuti oleh:
  // - end of string, atau
  // - karakter BUKAN huruf (spasi, tanda baca, dll), atau
  // - spasi lalu kata lain selain "juz"
  const halfJuzPattern = /(?:1\/2|½)(?:\s+(?!juz\b)|\s*$|[^a-zA-Z])/gi;

  return halfJuzPattern.test(text);
};

interface DataStore extends DataContextType {
  loadData: () => Promise<void>;
  getNearestAvailableSlots: (classId: string, examType: 'non-5juz' | '5juz', limit?: number, juzPortion?: 'full' | 'half') => Promise<AvailableSlot[]>;
  getAvailableSlotsForDateRange: (classId: string, startDate: string, endDate: string, juzPortion?: 'full' | 'half') => Promise<AvailableSlot[]>;
  getClassScheduleForDay: (classSchedule: string, dayName: string) => string[];
  addStudentOptimized: (classId: string, studentName: string) => Promise<any>;
  addClassOptimized: (classData: Omit<ClassData, "id" | "students" | "created_at" | "updated_at">) => Promise<ClassData | null>;
  addExamOptimized: (classId: string, studentId: string, examData: Omit<Exam, "id" | "created_at" | "updated_at" | "student_id" | "class_id">) => Promise<Exam | null>;
  updateExam: (classId: string, studentId: string, examId: string, examData: { status?: string; score?: string | null; examiner_name?: string | null; examiner_password?: string | null }) => Promise<void>;
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

  // Add class without full data reload - returns the new class data
  addClassOptimized: async (classData: Omit<ClassData, "id" | "students" | "created_at" | "updated_at">) => {
    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "INSERT INTO classes (id, name, schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, classData.name, classData.schedule, now, now],
      });

      // Return the new class data without full reload
      const newClass: ClassData = {
        id,
        name: classData.name,
        schedule: classData.schedule,
        students: [],
        created_at: now,
        updated_at: now,
      };

      // Update local state optimistically
      const { classes } = get();
      set({ classes: [...classes, newClass] });

      return newClass;
    } catch (err) {
      console.error("Failed to add class:", err);
      set({ error: "Failed to add class" });
      return null;
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

  // Add student without full data reload - returns the new student data
  addStudentOptimized: async (classId: string, studentName: string) => {
    const id = `student_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      await client.execute({
        sql: "INSERT INTO students (id, class_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, classId, studentName, now, now],
      });

      // Return the new student data without full reload
      const newStudent = {
        id,
        class_id: classId,
        name: studentName,
        created_at: now,
        updated_at: now,
        exams: []
      };

      // Update local state optimistically
      const { classes } = get();
      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            students: [...cls.students, newStudent]
          };
        }
        return cls;
      });

      set({ classes: updatedClasses });
      return newStudent;
    } catch (err) {
      console.error("Failed to add student:", err);
      set({ error: "Failed to add student" });
      return null;
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

  addExam: async (classId: string, studentId: string, examData: Omit<Exam, "id" | "created_at" | "updated_at" | "student_id" | "class_id">) => {
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

  // Add exam without full data reload - returns the new exam data
  addExamOptimized: async (classId: string, studentId: string, examData: Omit<Exam, "id" | "created_at" | "updated_at" | "student_id" | "class_id">) => {
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

      // Return the new exam data without full reload
      const newExam: Exam = {
        id,
        student_id: studentId,
        class_id: classId,
        exam_date: examData.exam_date,
        exam_date_key: examData.exam_date_key,
        status: examData.status,
        score: examData.score,
        juz_number: examData.juz_number,
        exam_type: examData.exam_type,
        notes: examData.notes,
        exam_day: examData.exam_day,
        exam_period: examData.exam_period,
        created_at: now,
        updated_at: now,
      };

      // Update local state optimistically
      const { classes } = get();
      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            students: cls.students.map(student => {
              if (student.id === studentId) {
                return {
                  ...student,
                  exams: [...(student.exams || []), newExam]
                };
              }
              return student;
            })
          };
        }
        return cls;
      });

      set({ classes: updatedClasses });
      return newExam;
    } catch (err) {
      console.error("Failed to add exam:", err);
      set({ error: "Failed to add exam" });
      return null;
    }
  },

  // Update exam with status, score, examiner_name, and examiner_password
  updateExam: async (classId: string, studentId: string, examId: string, examData: { status?: string; score?: string | null; examiner_name?: string | null; examiner_password?: string | null }) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      const fields = [];
      const values = [];

      if (examData.status !== undefined) {
        fields.push("status = ?");
        values.push(examData.status);
      }
      if (examData.score !== undefined) {
        fields.push("score = ?");
        values.push(examData.score === '' ? null : examData.score);
      }
      if (examData.examiner_name !== undefined) {
        fields.push("examiner_name = ?");
        values.push(examData.examiner_name);
      }
      if (examData.examiner_password !== undefined) {
        fields.push("examiner_password = ?");
        values.push(examData.examiner_password);
      }

      fields.push("updated_at = ?");
      values.push(now);
      values.push(examId);

      await client.execute({
        sql: `UPDATE exams SET ${fields.join(", ")} WHERE id = ?`,
        args: values,
      });

      // Reload data to reflect changes
      await get().loadData();
    } catch (err) {
      console.error("Failed to update exam:", err);
      set({ error: "Failed to update exam" });
    }
  },

  // New function to check date conflicts across ALL classes with 1/2 juz support
  checkDateConflict: async (classId: string, dateKey: string, period: string, juzNumber?: string) => {
    try {
      // Get all exams for this slot
      const result = await client.execute({
        sql: "SELECT * FROM exams WHERE exam_date_key = ? AND exam_period = ?",
        args: [dateKey, period],
      });

      const existingExams = result.rows || [];

      // Cek apakah ini ujian 1/2 juz
      const isNewHalfJuz = isHalfJuz(juzNumber);

      // Hitung berapa ujian 1 juz vs 1/2 juz yang sudah ada
      let fullJuzCount = 0;
      let halfJuzCount = 0;

      for (const exam of existingExams) {
        if (exam.exam_type === '5juz') {
          // 5juz selalu 1 murid per slot, conflict
          return true;
        }
        if (isHalfJuz(exam.juz_number)) {
          halfJuzCount++;
        } else {
          fullJuzCount++;
        }
      }

      // Logic:
      // - Jika ada 1 juz yang sudah booking → conflict
      // - Jika ada 2 half juz yang sudah booking → conflict
      // - Jika ada 1 half juz yang sudah booking:
      //   - Boleh jika yang baru juga half juz
      //   - Conflict jika yang baru full juz

      if (fullJuzCount > 0) return true; // Ada full juz, conflict
      if (halfJuzCount >= 2) return true; // Sudah 2 half juz, penuh

      // 1 half juz sudah ada
      if (halfJuzCount === 1) {
        // Hanya boleh tambah jika yang baru juga half juz
        return !isNewHalfJuz;
      }

      // Slot kosong, selalu available
      return false;
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

  // Get available slots for a specific date range with 1/2 juz support
  getAvailableSlotsForDateRange: async (classId: string, startDate: string, endDate: string, juzPortion?: 'full' | 'half') => {
    try {
      // Get class data
      const classData = get().findClass(classId);
      if (!classData) return [];

      // Get all exams in the date range across ALL classes to prevent cross-class conflicts
      const examsResult = await client.execute({
        sql: "SELECT * FROM exams WHERE exam_date_key BETWEEN ? AND ? ORDER BY exam_date_key, exam_period",
        args: [startDate, endDate],
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

        // Get exams for this specific date
        const dateExams = existingExams.filter(exam => exam.exam_date_key === dateKey);

        // Track period capacity based on what we're booking
        const fullyBookedPeriods = new Set<string>();
        const halfJuzPeriodCount: Record<string, number> = {};

        for (const exam of dateExams) {
          if (!exam.exam_period) continue;

          const periodStr = String(exam.exam_period);

          // 5juz always fully books a slot (incompatible with everything)
          if (exam.exam_type === '5juz') {
            fullyBookedPeriods.add(periodStr);
            continue;
          }

          // Non-5juz exams
          const examIsHalfJuz = isHalfJuz(exam.juz_number);

          if (juzPortion === 'half') {
            // Booking 1/2 juz: can share with another 1/2 juz
            if (examIsHalfJuz) {
              halfJuzPeriodCount[periodStr] = (halfJuzPeriodCount[periodStr] || 0) + 1;
              // 2 half juz = fully booked
              if (halfJuzPeriodCount[periodStr] >= 2) {
                fullyBookedPeriods.add(periodStr);
              }
            } else {
              // 1 juz fully books the slot (incompatible with 1/2 juz)
              fullyBookedPeriods.add(periodStr);
            }
          } else {
            // Booking 1 juz (or unspecified): any existing exam fully books the slot
            fullyBookedPeriods.add(periodStr);
          }
        }

        // Generate available slots for this day
        for (const period of validPeriods) {
          // Slot is available if not fully booked
          if (!fullyBookedPeriods.has(period)) {
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
  getNearestAvailableSlots: async (classId: string, examType: 'non-5juz' | '5juz', limit?: number, juzPortion?: 'full' | 'half') => {
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
          dateKey,
          juzPortion
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