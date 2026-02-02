// Script untuk verify slot calculation fix
import client from '../lib/db';

async function verifyFix() {
  console.log('=== VERIFY SLOT FIX ===\n');

  const targetDate = '2026-02-02';
  const classId = 'class_1762828900597_ce781klad'; // Salman

  // Get kelas Salman
  const classResult = await client.execute({
    sql: "SELECT * FROM classes WHERE id = ?",
    args: [classId]
  });
  const salmanClass = classResult.rows[0] as any;
  console.log('Kelas:', salmanClass.name);
  console.log('Schedule:', salmanClass.schedule);
  console.log();

  // Get pengujis
  const pengujisResult = await client.execute("SELECT * FROM penguji ORDER BY name");

  // Get Ustadz Nawir
  const ustadzNawir = pengujisResult.rows.find((p: any) => p.name === 'Ustadz Nawir') as any;
  console.log('Penguji:', ustadzNawir.name);
  console.log('Schedule:', ustadzNawir.schedule);
  console.log();

  // Get semua exams di tanggal tersebut
  const examsResult = await client.execute({
    sql: "SELECT * FROM exams WHERE exam_date_key = ? ORDER BY exam_period",
    args: [targetDate]
  });

  // Hitung exams yang termasuk Ustadz Nawir (termasuk NULL)
  const ustadzNawirExams = examsResult.rows.filter((exam: any) => {
    return exam.examiner_name === 'Ustadz Nawir' ||
           exam.examiner_name === null ||
           exam.examiner_name === '';
  });

  console.log('Total ujian di ' + targetDate + ':', examsResult.rows.length);
  console.log('Ujian untuk Ustadz Nawir (termasuk NULL):', ustadzNawirExams.length);
  console.log();

  // Group by period
  const periodCount: Record<string, {total: number, halfJuz: number, fullJuz: number, fiveJuz: number}> = {};

  for (const exam of ustadzNawirExams) {
    const period = exam.exam_period;
    if (!period) continue;

    if (!periodCount[period]) {
      periodCount[period] = { total: 0, halfJuz: 0, fullJuz: 0, fiveJuz: 0 };
    }

    const isHalfJuz = exam.juz_number?.includes('1/2') || exam.juz_number?.includes('½');
    const isFiveJuz = exam.exam_type === '5juz';

    periodCount[period].total++;

    if (isFiveJuz) {
      periodCount[period].fiveJuz++;
    } else if (isHalfJuz) {
      periodCount[period].halfJuz++;
    } else {
      periodCount[period].fullJuz++;
    }
  }

  console.log('Slot usage per periode:');
  for (const period of Object.keys(periodCount).sort()) {
    const data = periodCount[period];
    console.log(`  ${period}:`);
    console.log(`    Total: ${data.total}`);
    console.log(`    5juz: ${data.fiveJuz}`);
    console.log(`    1 juz: ${data.fullJuz}`);
    console.log(`    1/2 juz: ${data.halfJuz}`);

    // Determine if slot is available for new 1 juz exam
    const isFull = data.fiveJuz > 0 || data.fullJuz > 0 || data.halfJuz >= 2;
    console.log(`    Status: ${isFull ? '❌ FULL' : '✅ AVAILABLE'}`);
  }

  console.log();
  console.log('Untuk pendaftaran 1 juz baru dengan Ustadz Nawir:');
  const availableSlots = Object.keys(periodCount).filter(period => {
    const data = periodCount[period];
    return !(data.fiveJuz > 0 || data.fullJuz > 0 || data.halfJuz >= 2);
  });

  if (availableSlots.length === 0) {
    console.log('  ❌ Tidak ada slot tersedia');
  } else {
    console.log('  ✅ Slot tersedia:', availableSlots.join(', '));
  }

  process.exit(0);
}

verifyFix().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
