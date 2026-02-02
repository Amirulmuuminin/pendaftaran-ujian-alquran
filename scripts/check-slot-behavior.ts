// Script untuk cek behavior slot dan ujian
import client from '../lib/db';

async function checkBehavior() {
  console.log('=== CHECK SLOT BEHAVIOR ===\n');

  // 1. Get kelas Salman
  const classesResult = await client.execute({
    sql: "SELECT * FROM classes WHERE name LIKE ?",
    args: ['%salman%']
  });

  const salmanClass = classesResult.rows.find((c: any) => c.name.toLowerCase().includes('salman'));

  if (!salmanClass) {
    console.log('Kelas Salman tidak ditemukan!');
    console.log('Kelas yang tersedia:', classesResult.rows.map((c: any) => c.name));
    process.exit(0);
  }

  console.log('1. KELAS SALMAN');
  console.log('   ID:', salmanClass.id);
  console.log('   Name:', salmanClass.name);
  console.log('   Schedule:', salmanClass.schedule);
  console.log();

  // 2. Get semua penguji
  const pengujisResult = await client.execute("SELECT * FROM penguji ORDER BY name");
  console.log('2. DAFTAR PENGAJI (' + pengujisResult.rows.length + '):');
  pengujisResult.rows.forEach((p: any) => {
    console.log('   -', p.name, '(ID:', p.id + ')');
  });
  console.log();

  // 3. Get semua ujian di tanggal 2 Februari 2026
  const targetDate = '2026-02-02';
  const examsResult = await client.execute({
    sql: "SELECT * FROM exams WHERE exam_date_key = ? ORDER BY exam_period",
    args: [targetDate]
  });

  console.log('3. SEMUA UJIAN DI TANGGAL ' + targetDate + ' (' + examsResult.rows.length + ' ujian):');
  if (examsResult.rows.length === 0) {
    console.log('   Tidak ada ujian di tanggal ini.');
  } else {
    examsResult.rows.forEach((exam: any) => {
      console.log('   - Student ID:', exam.student_id);
      console.log('     Class ID:', exam.class_id);
      console.log('     Juz:', exam.juz_number);
      console.log('     Periode:', exam.exam_period);
      console.log('     Tipe:', exam.exam_type);
      console.log('     Penguji:', exam.examiner_name || 'Ustadz Nawir (default)');
      console.log();
    });
  }

  // 4. Hitung slot tersedia untuk setiap penguji di tanggal 2 Feb 2026
  console.log('4. SLOT TERSEDIA PER PENGAJI DI TANGGAL ' + targetDate + ':');

  const targetDateObj = new Date(targetDate + 'T00:00:00');
  const dayName = targetDateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  console.log('   Hari:', dayName);
  console.log();

  // Parse jadwal kelas Salman
  let classSchedule: any = {};
  try {
    classSchedule = JSON.parse(salmanClass.schedule);
  } catch (e) {
    console.log('   ERROR: Gagal parse schedule kelas');
    process.exit(1);
  }

  const classDaySchedule = classSchedule[dayName.toLowerCase()] || [];
  console.log('   Jadwal kelas Salman di hari ini:', classDaySchedule.join(', ') || 'Tidak ada');

  // Apply day constraints (Selasa & Rabu hanya 4 periode)
  const maxPeriod = (dayName === 'Selasa' || dayName === 'Rabu') ? 4 : 5;
  const validPeriods = classDaySchedule.filter((slot: string) => {
    const slotNumber = parseInt(slot.replace('Jam ke-', ''));
    return slotNumber <= maxPeriod;
  });
  console.log('   Periode valid (max ' + maxPeriod + '):', validPeriods.join(', ') || 'Tidak ada');
  console.log();

  // Untuk setiap penguji, hitung slot tersedia
  for (const penguji of pengujisResult.rows) {
    let pengujiSchedule: any = {};
    try {
      pengujiSchedule = JSON.parse(penguji.schedule);
    } catch (e) {
      console.log('   ERROR: Gagal parse schedule penguji', penguji.name);
      continue;
    }

    const pengujiDaySchedule = pengujiSchedule[dayName.toLowerCase()] || [];
    console.log('   ' + penguji.name + ':');
    console.log('     Jadwal di hari ini:', pengujiDaySchedule.join(', ') || 'Tidak ada');

    // Intersect kelas & penguji schedule
    const availablePeriods = validPeriods.filter((period: string) =>
      pengujiDaySchedule.includes(period)
    );
    console.log('     Irisan jadwal:', availablePeriods.join(', ') || 'Tidak ada');

    // Get exams for this penguji on this date
    // Include exams with examiner_name = NULL as default "Ustadz Nawir"
    const pengujiExams = examsResult.rows.filter((e: any) => {
      // Ustadz Nawir is the default examiner
      if (penguji.name === 'Ustadz Nawir') {
        return e.examiner_name === 'Ustadz Nawir' || e.examiner_name === null || e.examiner_name === '';
      }
      return e.examiner_name === penguji.name;
    });

    // Hitung slot yang sudah terisi
    const fullyBookedPeriods = new Set<string>();
    const halfJuzPeriodCount: Record<string, number> = {};

    for (const exam of pengujiExams) {
      if (!exam.exam_period) continue;
      const periodStr = String(exam.exam_period);

      if (exam.exam_type === '5juz') {
        fullyBookedPeriods.add(periodStr);
        continue;
      }

      const examIsHalfJuz = exam.juz_number?.includes('1/2') || exam.juz_number?.includes('½');

      if (examIsHalfJuz) {
        halfJuzPeriodCount[periodStr] = (halfJuzPeriodCount[periodStr] || 0) + 1;
        if (halfJuzPeriodCount[periodStr] >= 2) {
          fullyBookedPeriods.add(periodStr);
        }
      } else {
        fullyBookedPeriods.add(periodStr);
      }
    }

    // Slot tersedia = availablePeriods - fullyBookedPeriods
    const availableSlots = availablePeriods.filter((period: string) => !fullyBookedPeriods.has(period));

    console.log('     Slot terisi:', Array.from(fullyBookedPeriods).join(', ') || 'Tidak ada');
    console.log('     SLOT TERSEDIA:', availableSlots.join(', ') || 'Tidak ada slot tersedia');
    console.log();
  }

  console.log('=== SELESAI ===');
  process.exit(0);
}

checkBehavior().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
