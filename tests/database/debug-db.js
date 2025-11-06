// Debug script untuk test koneksi database dan investigasi slot availability
import { createClient } from '@libsql/client';

// Test koneksi dengan hardcoded credentials dari lib/db.ts
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function debugDatabase() {
  console.log('🔍 Database Debug - Starting investigation...\n');

  try {
    // Test 1: Basic Connection
    console.log('📡 Test 1: Basic Connection');
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Connection successful:', result.rows[0]);
    console.log('');

    // Test 2: Check Classes Table
    console.log('📋 Test 2: Classes Table Structure');
    const classesQuery = await client.execute('SELECT * FROM classes LIMIT 5');
    console.log('Classes found:', classesQuery.rows.length);
    classesQuery.rows.forEach((cls, i) => {
      console.log(`Class ${i + 1}:`);
      console.log(`  ID: ${cls.id}`);
      console.log(`  Name: ${cls.name}`);
      console.log(`  Schedule: ${cls.schedule}`);
      console.log(`  Created: ${new Date(cls.created_at * 1000).toLocaleString()}`);
      console.log('');
    });

    if (classesQuery.rows.length > 0) {
      // Test 3: Parse Schedule JSON
      console.log('📝 Test 3: Schedule JSON Parsing');
      const firstClass = classesQuery.rows[0];
      console.log(`Testing schedule from class: ${firstClass.name}`);

      try {
        const schedule = JSON.parse(firstClass.schedule);
        console.log('✅ Schedule JSON parsed successfully:');
        console.log(JSON.stringify(schedule, null, 2));

        // Test day access
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        days.forEach(day => {
          const daySchedule = schedule[day];
          if (daySchedule && daySchedule.length > 0) {
            console.log(`  ${day}: ${daySchedule.join(', ')}`);
          }
        });
      } catch (error) {
        console.log('❌ Schedule JSON parsing failed:', error.message);
      }
      console.log('');
    }

    // Test 4: Check Students Table
    console.log('👥 Test 4: Students Table');
    const studentsQuery = await client.execute('SELECT * FROM students LIMIT 3');
    console.log('Students found:', studentsQuery.rows.length);
    studentsQuery.rows.forEach((student, i) => {
      console.log(`Student ${i + 1}: ${student.name} (Class: ${student.class_id})`);
    });
    console.log('');

    // Test 5: Check Exams Table
    console.log('📅 Test 5: Exams Table');
    const examsQuery = await client.execute('SELECT * FROM exams LIMIT 5');
    console.log('Exams found:', examsQuery.rows.length);
    examsQuery.rows.forEach((exam, i) => {
      console.log(`Exam ${i + 1}:`);
      console.log(`  Student ID: ${exam.student_id}`);
      console.log(`  Class ID: ${exam.class_id}`);
      console.log(`  Date: ${exam.exam_date_key} (${new Date(exam.exam_date * 1000).toLocaleDateString()})`);
      console.log(`  Period: ${exam.exam_period}`);
      console.log(`  Type: ${exam.exam_type}`);
    });
    console.log('');

    // Test 6: Manual Slot Calculation
    if (classesQuery.rows.length > 0) {
      console.log('🧮 Test 6: Manual Slot Calculation');
      const testClass = classesQuery.rows[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Test for tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = tomorrow.toISOString().split('T')[0];
      const tomorrowDay = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });

      console.log(`Testing slots for: ${tomorrowDay}, ${tomorrowKey}`);

      // Check existing exams for tomorrow
      const tomorrowExams = await client.execute({
        sql: 'SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?',
        args: [testClass.id, tomorrowKey]
      });

      console.log(`Existing exams for ${tomorrowKey}:`, tomorrowExams.rows.length);
      tomorrowExams.rows.forEach(exam => {
        console.log(`  - ${exam.exam_period} (Student: ${exam.student_id})`);
      });

      // Test schedule parsing
      try {
        const schedule = JSON.parse(testClass.schedule);
        const dayKey = tomorrowDay.toLowerCase();
        const daySchedule = schedule[dayKey] || [];
        console.log(`Schedule for ${tomorrowDay}: ${daySchedule.join(', ')}`);

        // Apply day constraints
        const maxPeriod = (tomorrowDay === 'Selasa' || tomorrowDay === 'Rabu') ? 4 : 5;
        const validPeriods = daySchedule.filter(slot => {
          const slotNumber = parseInt(slot.replace('Jam ke-', ''));
          return slotNumber <= maxPeriod;
        });

        console.log(`Valid periods (max ${maxPeriod}): ${validPeriods.join(', ')}`);

        // Calculate available slots
        const bookedPeriods = tomorrowExams.rows.map(exam => exam.exam_period).filter(Boolean);
        const availableSlots = validPeriods.filter(period => !bookedPeriods.includes(period));

        console.log(`Booked periods: ${bookedPeriods.join(', ') || 'None'}`);
        console.log(`Available slots: ${availableSlots.length}`);
        availableSlots.forEach(slot => {
          console.log(`  - ${slot}`);
        });

        if (availableSlots.length > 0) {
          console.log('✅ Slots should be available!');
        } else {
          console.log('❌ No slots available for this date');
        }

      } catch (error) {
        console.log('❌ Error calculating slots:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run debug
debugDatabase().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});