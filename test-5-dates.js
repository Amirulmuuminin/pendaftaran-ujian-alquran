// Test script untuk 5 tanggal berbeda terdekat yang memiliki slot
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

function generateSlotsForDate(schedule, existingExams, dateKey) {
  const date = new Date(dateKey + 'T00:00:00.000Z');
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = dayNames[date.getUTCDay()];
  const dayKey = dayName.toLowerCase();

  // Get schedule for this day
  const daySchedule = schedule[dayKey] || [];
  if (daySchedule.length === 0) return [];

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
  const availablePeriods = validPeriods.filter(period => !bookedPeriods.includes(period));

  if (availablePeriods.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const distance = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  return availablePeriods.map(period => ({
    date,
    dateKey,
    period,
    dayName,
    displayText: `${dayName}, ${date.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getUTCMonth()]} - ${period.replace('Jam ke-', 'Jam ')}`,
    distance
  }));
}

async function test5DifferentDates() {
  console.log('🧪 Testing 5 Different Nearest Dates with Available Slots\n');

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

    // Test new logic: Find 5 different nearest dates with slots
    const targetDates = 5;
    const maxSearchDays = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allSlots = [];
    const datesWithSlots = new Set();
    let dayOffset = 0;

    console.log(`🔍 Searching for ${targetDates} different dates with available slots...`);

    while (datesWithSlots.size < targetDates && dayOffset < maxSearchDays) {
      dayOffset++;
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dateKey = checkDate.toISOString().split('T')[0];

      // Get existing exams for this date
      const examsResult = await client.execute({
        sql: "SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?",
        args: [testClass.id, dateKey],
      });
      const existingExams = examsResult.rows;

      // Check slots for this date
      const daySlots = generateSlotsForDate(schedule, existingExams, dateKey);

      if (daySlots.length > 0) {
        console.log(`✅ Day ${dayOffset}: ${dateKey} - Found ${daySlots.length} slots`);
        allSlots.push(...daySlots);
        datesWithSlots.add(dateKey);

        // Show the slots
        const firstSlot = daySlots[0];
        console.log(`   📅 ${firstSlot.dayName}, ${dateKey} (${firstSlot.distance === 1 ? 'Besok' : firstSlot.distance === 2 ? 'Lusa' : `${firstSlot.distance} hari lagi`}):`);
        daySlots.forEach(slot => {
          console.log(`      • ${slot.period}`);
        });
      } else {
        const date = new Date(dateKey + 'T00:00:00.000Z');
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = dayNames[date.getUTCDay()];
        const dayKey = dayName.toLowerCase();
        const hasSchedule = schedule[dayKey] && schedule[dayKey].length > 0;

        console.log(`❌ Day ${dayOffset}: ${dateKey} - No slots available (${hasSchedule ? 'All booked' : 'No class schedule'})`);
      }
    }

    console.log(`\n🎉 Results:`);
    console.log(`   • Days searched: ${dayOffset}`);
    console.log(`   • Different dates with slots: ${datesWithSlots.size}`);
    console.log(`   • Total available slots: ${allSlots.length}`);
    console.log(`   • Average slots per date: ${datesWithSlots.size > 0 ? (allSlots.length / datesWithSlots.size).toFixed(1) : 0}`);

    if (datesWithSlots.size >= targetDates) {
      console.log(`   ✅ Success! Found ${targetDates} different dates with slots`);
    } else {
      console.log(`   ⚠️  Only found ${datesWithSlots.size} dates with slots (wanted ${targetDates})`);
    }

    // Show the dates found
    console.log(`\n📅 Different dates found:`);
    const slotsByDate = {};
    allSlots.forEach(slot => {
      if (!slotsByDate[slot.dateKey]) {
        slotsByDate[slot.dateKey] = [];
      }
      slotsByDate[slot.dateKey].push(slot);
    });

    Object.keys(slotsByDate).sort().forEach(dateKey => {
      const daySlots = slotsByDate[dateKey];
      const firstSlot = daySlots[0];
      console.log(`   • ${firstSlot.dayName}, ${dateKey} (${daySlots.length} slots)`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test5DifferentDates().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});