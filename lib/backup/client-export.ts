import * as XLSX from 'xlsx';

export interface BackupData {
  classes: any[];
  students: any[];
  exams: any[];
  pengujis: any[];
}

// Generate filename with timestamp
export function generateBackupFilename(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `backup-ujian-alquran-${date}_${time}.xlsx`;
}

// Export data to Excel file (client-side)
export function exportToExcel(data: BackupData, filename?: string): void {
  const workbook = XLSX.utils.book_new();

  // Transform data for better readability
  const classesData = data.classes.map(c => ({
    ID: c.id,
    'Nama Kelas': c.name,
    Jadwal: c.schedule,
    'Dibuat': new Date(c.created_at * 1000).toLocaleString('id-ID'),
    'Diperbarui': new Date(c.updated_at * 1000).toLocaleString('id-ID'),
  }));

  const studentsData = data.students.map(s => ({
    ID: s.id,
    'ID Kelas': s.class_id,
    'Nama Siswa': s.name,
    'Dibuat': new Date(s.created_at * 1000).toLocaleString('id-ID'),
    'Diperbarui': new Date(s.updated_at * 1000).toLocaleString('id-ID'),
  }));

  const examsData = data.exams.map(e => ({
    ID: e.id,
    'ID Siswa': e.student_id,
    'ID Kelas': e.class_id,
    'Tanggal Ujian': e.exam_date ? new Date(e.exam_date * 1000).toLocaleString('id-ID') : '-',
    'Kunci Tanggal': e.exam_date_key || '-',
    Status: e.status,
    Nilai: e.score || '-',
    'Juz Number': e.juz_number || '-',
    'Tipe Ujian': e.exam_type,
    Catatan: e.notes || '-',
    'Hari Ujian': e.exam_day || '-',
    'Periode Ujian': e.exam_period || '-',
    'Nama Penguji': e.examiner_name || '-',
    'Dibuat': new Date(e.created_at * 1000).toLocaleString('id-ID'),
    'Diperbarui': new Date(e.updated_at * 1000).toLocaleString('id-ID'),
  }));

  const pengujisData = data.pengujis.map(p => ({
    ID: p.id,
    'Nama Penguji': p.name,
    Jadwal: p.schedule,
    'Tipe Ujian': p.supported_exam_types,
    'Maksimal Ujian/Hari': p.max_exams_per_day || 'Tanpa Batas',
    'Dibuat': new Date(p.created_at * 1000).toLocaleString('id-ID'),
    'Diperbarui': new Date(p.updated_at * 1000).toLocaleString('id-ID'),
  }));

  // Add sheets to workbook
  if (classesData.length > 0) {
    const classesSheet = XLSX.utils.json_to_sheet(classesData);
    XLSX.utils.book_append_sheet(workbook, classesSheet, 'Kelas');
  }

  if (studentsData.length > 0) {
    const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Siswa');
  }

  if (examsData.length > 0) {
    const examsSheet = XLSX.utils.json_to_sheet(examsData);
    XLSX.utils.book_append_sheet(workbook, examsSheet, 'Ujian');
  }

  if (pengujisData.length > 0) {
    const pengujisSheet = XLSX.utils.json_to_sheet(pengujisData);
    XLSX.utils.book_append_sheet(workbook, pengujisSheet, 'Penguji');
  }

  // Generate filename and download
  const finalFilename = filename || generateBackupFilename();
  XLSX.writeFile(workbook, finalFilename);
}
