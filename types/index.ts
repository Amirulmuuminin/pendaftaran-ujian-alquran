// Core data types for Quran Exam Application

export interface Class {
  id: string;
  name: string;
  schedule: string;
  created_at: number;
  updated_at: number;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  created_at: number;
  updated_at: number;
  exams?: Exam[];
}

export interface Exam {
  id: string;
  student_id: string;
  class_id: string;
  exam_date: number;
  exam_date_key?: string;
  status: string;
  score?: number;
  juz_number?: string;
  exam_type: 'non-5juz' | '5juz';
  notes?: string;
  exam_day?: string;
  exam_period?: string;
  created_at: number;
  updated_at: number;
}

export interface ClassData {
  id: string;
  name: string;
  schedule: string;
  students: Student[];
  created_at: number;
  updated_at: number;
}

export interface DataContextType {
  classes: ClassData[];
  loading: boolean;
  error: string | null;
  findClass: (classId: string) => ClassData | undefined;
  addClass: (classData: Omit<ClassData, 'id' | 'students' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClass: (classId: string, updatedData: Partial<ClassData>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  addStudent: (classId: string, studentName: string) => Promise<void>;
  updateStudent: (classId: string, studentId: string, newName: string) => Promise<void>;
  deleteStudent: (classId: string, studentId: string) => Promise<void>;
  addExam: (classId: string, studentId: string, examData: Omit<Exam, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteExam: (classId: string, studentId: string, examId: string) => Promise<void>;
  checkDateConflict: (classId: string, dateKey: string, period: string) => Promise<boolean>;
  getExamsByDate: (classId: string, dateKey: string) => Promise<any[]>;
}

export const scheduleDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
export const scheduleSlots = [
  { value: 1, label: 'Jam ke-1' },
  { value: 2, label: 'Jam ke-2' },
  { value: 3, label: 'Jam ke-3' },
  { value: 4, label: 'Jam ke-4' },
  { value: 5, label: 'Jam ke-5' },
];

export const juzRanges = [
  { value: '1-5', label: '1-5' },
  { value: '6-10', label: '6-10' },
  { value: '11-15', label: '11-15' },
  { value: '16-20', label: '16-20' },
  { value: '21-25', label: '21-25' },
  { value: '26-30', label: '26-30' },
];

// New types for unified slot system
export interface AvailableSlot {
  date: Date;
  dateKey: string; // YYYY-MM-DD format
  period: string; // "Jam ke-1", "Jam ke-2", etc.
  dayName: string; // "Senin", "Selasa", etc.
  displayText: string; // "Senin, 6 Des - Jam 1"
  distance: number; // days from today
}

export interface SlotSelection {
  dateKey: string;
  period: string;
}

export interface ExamSlotSelectorProps {
  selectedSlot?: SlotSelection;
  onSlotChange: (slot: SlotSelection) => void;
  examType: 'non-5juz' | '5juz';
  classSchedule?: string;
  existingExams?: Exam[];
  disabled?: boolean;
  classId: string; // Required for proper slot discovery
}

export interface MultiSlotSelectorProps extends Omit<ExamSlotSelectorProps, 'selectedSlot' | 'onSlotChange'> {
  selectedSlots: SlotSelection[];
  onSlotsChange: (slots: SlotSelection[]) => void;
  requiredCount: number; // 5 for 5juz exams
}