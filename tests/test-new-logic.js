// Test script untuk logic baru - menampilkan semua slot dalam 5 hari
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

// Helper function untuk generate slot
function generateSlotsForDateRange(schedule, existingExams, startDate, endDate) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get Indonesian day names
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateKey = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];
    const dayKey = dayName.toLowerCase();

    // Get schedule for this day
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

    // Generate available slots
    validPeriods.forEach(period => {
      if (!bookedPeriods.includes(period)) {
        const distance = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        slots.push({
          date: new Date(date),
          dateKey,
          period,
          dayName,
          displayText: `${dayName}, ${date.getDate()} ${monthNames[date.getMonth()]} - ${period.replace('Jam ke-', 'Jam ')}`,
          distance
        });
      }
    });
  }

  return slots.sort((a, b) => a.distance - b.distance);
}

async function testNewLogic() {
  console.log('🧪 Testing New Logic - All slots in 5 days\n');

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

    // Calculate date range (5 days from tomorrow)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 5);

    console.log(`🔍 Checking slots from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Generate all available slots
    const allSlots = generateSlotsForDateRange(
      schedule,
      [], // No existing exams
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    console.log(`\n✅ Found ${allSlots.length} total available slots in 5 days:`);

    // Group by day for better visualization
    const slotsByDay = {};
    allSlots.forEach(slot => {
      if (!slotsByDay[slot.dateKey]) {
        slotsByDay[slot.dateKey] = [];
      }
      slotsByDay[slot.dateKey].push(slot);
    });

    Object.keys(slotsByDay).sort().forEach(dateKey => {
      const daySlots = slotsByDay[dateKey];
      const firstSlot = daySlots[0];
      console.log(`\n📅 ${firstSlot.dayName}, ${dateKey}:`);
      daySlots.forEach(slot => {
        console.log(`   • ${slot.period} (${slot.distance === 1 ? 'Besok' : slot.distance === 2 ? 'Lusa' : `${slot.distance} hari lagi`})`);
      });
    });

    console.log(`\n🎉 Summary:`);
    console.log(`   • Total days checked: 5`);
    console.log(`   • Total available slots: ${allSlots.length}`);
    console.log(`   • Average slots per day: ${(allSlots.length / 5).toFixed(1)}`);

    if (allSlots.length > 5) {
      console.log(`   ✅ Logic updated! Showing ${allSlots.length} slots instead of just 5`);
    } else {
      console.log(`   ℹ️  Found ${allSlots.length} slots (this is expected for limited schedule)`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewLogic().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});