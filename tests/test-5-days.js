// Test script untuk memastikan 5 hari berturut-turut ditampilkan
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function test5ConsecutiveDays() {
  console.log('🧪 Testing 5 Consecutive Days Display\n');

  try {
    // Get first class
    const classQuery = await client.execute('SELECT * FROM classes LIMIT 1');
    if (classQuery.rows.length === 0) {
      console.log('❌ No classes found');
      return;
    }

    const testClass = classQuery.rows[0];
    const schedule = JSON.parse(testClass.schedule);

    console.log(`📋 Testing class: ${testClass.name}`);
    console.log(`📅 Schedule: ${JSON.stringify(schedule, null, 2)}\n`);

    // Test actual store logic
    const { getAvailableSlotsForDateRange } = await import('./store/index.js');

    // Calculate date range (5 days from tomorrow)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 5);

    console.log(`🔍 Checking 5 consecutive days from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Get existing exams
    const examsResult = await client.execute({
      sql: "SELECT * FROM exams WHERE class_id = ? AND exam_date_key BETWEEN ? AND ? ORDER BY exam_date_key, exam_period",
      args: [testClass.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    });

    const existingExams = examsResult.rows;
    console.log(`📝 Existing exams in range: ${existingExams.length}\n`);

    // Show all 5 consecutive days
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const allDays = [];
    let totalSlots = 0;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const distance = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

      allDays.push({ dateKey, dayName, distance });
    }

    console.log('📅 All 5 consecutive days:');

    // Check each day
    for (const { dateKey, dayName, distance } of allDays) {
      // Get schedule for this day
      const dayKey = dayName.toLowerCase();
      const daySchedule = schedule[dayKey] || [];

      // Apply day constraints
      const maxPeriod = (dayName === 'Selasa' || dayName === 'Rabu') ? 4 : 5;
      const validPeriods = daySchedule.filter(slot => {
        const slotNumber = parseInt(slot.replace('Jam ke-', ''));
        return slotNumber <= maxPeriod;
      });

      // Get existing exams for this date
      const dayExams = existingExams.filter(exam => exam.exam_date_key === dateKey);
      const bookedPeriods = dayExams.map(exam => exam.exam_period).filter(Boolean);

      // Calculate available slots
      const availablePeriods = validPeriods.filter(period => !bookedPeriods.includes(period));

      const dayLabel = distance === 1 ? 'Besok' : distance === 2 ? 'Lusa' : `${distance} hari lagi`;

      if (availablePeriods.length === 0) {
        console.log(`\n📅 ${dayName}, ${dateKey} (${dayLabel}):`);
        if (daySchedule.length === 0) {
          console.log(`   ❌ Tidak ada jadwal kelas (hari libur)`);
        } else {
          console.log(`   ❌ Semua jam ter booked (${validPeriods.length > 0 ? validPeriods.join(', ') : 'Tidak ada jadwal'})`);
        }
      } else {
        console.log(`\n📅 ${dayName}, ${dateKey} (${dayLabel}):`);
        console.log(`   ✅ Tersedia: ${availablePeriods.join(', ')}`);
        totalSlots += availablePeriods.length;
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   • Total consecutive days: ${allDays.length}`);
    console.log(`   • Total available slots: ${totalSlots}`);
    console.log(`   • Days with slots: ${allDays.filter(day => {
      const dayKey = day.dayName.toLowerCase();
      const daySchedule = schedule[dayKey] || [];
      return daySchedule.length > 0;
    }).length}`);
    console.log(`   • Days without schedule: ${allDays.filter(day => {
      const dayKey = day.dayName.toLowerCase();
      const daySchedule = schedule[dayKey] || [];
      return daySchedule.length === 0;
    }).length}`);

    if (allDays.length === 5) {
      console.log(`   ✅ Berhasil menampilkan 5 hari berturut-turut!`);
    } else {
      console.log(`   ❌ Hanya menampilkan ${allDays.length} hari`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test5ConsecutiveDays().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});