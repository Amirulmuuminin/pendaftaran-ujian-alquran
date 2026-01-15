// Constants for Quran Exam Application

export const TIME_SLOT_LABELS = [
  "Jam ke-1",
  "Jam ke-2",
  "Jam ke-3",
  "Jam ke-4",
  "Jam ke-5",
];

export const TIME_SLOT_COUNT = TIME_SLOT_LABELS.length; // 5 fixed slots

export const DAYS_OF_WEEK = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// DEFAULT_SCHEDULE: Array of 5 empty string elements for each day
export const DEFAULT_SCHEDULE = DAYS_OF_WEEK.reduce(
  (acc, day) => ({
    ...acc,
    [day.toLowerCase()]: Array(TIME_SLOT_COUNT).fill(""),
  }),
  {}
);

export const LOCAL_STORAGE_KEY = "examRecapAppData";

// Exam types
export const EXAM_TYPES = [
  "Ziyadah",
  "Murojaah",
  "Tasmik"
];

// Subject types
export const SUBJECT_TYPES = [
  "Juz 1",
  "Juz 2",
  "Juz 3",
  "Juz 4",
  "Juz 5",
  "Juz 6",
  "Juz 7",
  "Juz 8",
  "Juz 9",
  "Juz 10",
  "Juz 11",
  "Juz 12",
  "Juz 13",
  "Juz 14",
  "Juz 15",
  "Juz 16",
  "Juz 17",
  "Juz 18",
  "Juz 19",
  "Juz 20",
  "Juz 21",
  "Juz 22",
  "Juz 23",
  "Juz 24",
  "Juz 25",
  "Juz 26",
  "Juz 27",
  "Juz 28",
  "Juz 29",
  "Juz 30"
];

// Keywords untuk deteksi 1/2 juz dari juz_number text
// Hanya mendeteksi "1/2" atau "½" TANPA diikuti kata "juz"
export const HALF_JUZ_KEYWORDS = [
  "1/2",
  "½",
];

// Tipe porsi juz untuk dropdown
export const JUZ_PORTION_TYPES = [
  { value: "full", label: "1 Juz" },
  { value: "half", label: "1/2 Juz" },
];

// Suffix untuk 1/2 juz
export const HALF_JUZ_SUFFIX = " - 1/2 juz";