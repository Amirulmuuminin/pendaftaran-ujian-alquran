"use client";
import { create } from 'zustand';
import { ClassData, Exam, DataContextType } from '../types';
import client from '../lib/db';

interface DataStore extends DataContextType {
  loadData: () => Promise<void>;
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
                  status: exam.status as string,
                  score: exam.score as number | undefined,
                  juz_number: exam.juz_number as string | undefined,
                  exam_type: exam.exam_type as "non-5juz" | "5juz",
                  notes: exam.notes as string | undefined,
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
        sql: "INSERT INTO exams (id, student_id, class_id, exam_date, status, score, juz_number, exam_type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          id,
          studentId,
          classId,
          examData.exam_date,
          examData.status,
          examData.score || null,
          examData.juz_number || null,
          examData.exam_type,
          examData.notes || null,
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
}));

export default useDataStore;