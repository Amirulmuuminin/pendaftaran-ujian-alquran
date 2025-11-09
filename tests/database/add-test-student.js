// Add a test student to umar class for testing slot availability
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function addTestStudent() {
  console.log('👤 Adding test student to umar class...\n');

  try {
    // Step 1: Find the umar class
    console.log('📋 Step 1: Finding umar class...');
    const umarQuery = await client.execute({
      sql: 'SELECT * FROM classes WHERE name = ?',
      args: ['umar']
    });

    if (umarQuery.rows.length === 0) {
      console.log('❌ Class "umar" not found');
      return;
    }

    const umarClass = umarQuery.rows[0];
    console.log(`✅ Found umar class: ID=${umarClass.id}`);

    // Step 2: Check existing students
    console.log('\n👥 Step 2: Checking existing students...');
    const existingStudentsQuery = await client.execute({
      sql: 'SELECT * FROM students WHERE class_id = ?',
      args: [umarClass.id]
    });

    console.log(`Found ${existingStudentsQuery.rows.length} existing students:`);
    existingStudentsQuery.rows.forEach((student, i) => {
      console.log(`  ${i + 1}. ${student.name} (ID: ${student.id})`);
    });

    // Step 3: Add test student if no students exist
    if (existingStudentsQuery.rows.length === 0) {
      console.log('\n➕ Step 3: Adding test student...');

      const timestamp = Date.now();
      const studentId = `student_${timestamp}_testumar`;

      const insertResult = await client.execute({
        sql: 'INSERT INTO students (id, name, class_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        args: [
          studentId,
          'Test Umar Student',
          umarClass.id,
          Math.floor(timestamp / 1000),
          Math.floor(timestamp / 1000)
        ]
      });

      console.log(`✅ Added test student: ID=${studentId}`);
      console.log(`✅ Student name: Test Umar Student`);
      console.log(`✅ Assigned to class: ${umarClass.name} (${umarClass.id})`);

      // Step 4: Verify the student was added
      console.log('\n✅ Step 4: Verifying student addition...');
      const verifyQuery = await client.execute({
        sql: 'SELECT * FROM students WHERE class_id = ?',
        args: [umarClass.id]
      });

      console.log(`Total students in umar class: ${verifyQuery.rows.length}`);
      verifyQuery.rows.forEach((student, i) => {
        console.log(`  ${i + 1}. ${student.name} (ID: ${student.id})`);
      });

      console.log('\n🎉 Test student added successfully!');
      console.log('✅ Now you can test exam scheduling for the umar class');
      console.log('✅ The slot picker should show available time slots');

    } else {
      console.log('\n⚠️  Students already exist in umar class');
      console.log('✅ You can test exam scheduling with existing students');
    }

    // Step 5: Test slot availability calculation
    console.log('\n🧮 Step 5: Testing slot availability calculation...');

    // Get the current schedule
    const schedule = JSON.parse(umarClass.schedule);

    // Test for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });
    const tomorrowDayKey = tomorrowDay.toLowerCase();
    const tomorrowKey = tomorrow.toISOString().split('T')[0];

    console.log(`\nTesting slots for: ${tomorrowDay} (${tomorrowKey})`);

    if (schedule[tomorrowDayKey]) {
      const daySchedule = schedule[tomorrowDayKey];
      console.log(`Schedule: ${daySchedule.join(', ')}`);

      // Apply day constraints
      const maxPeriod = (tomorrowDay === 'Selasa' || tomorrowDay === 'Rabu') ? 4 : 5;
      const validPeriods = daySchedule.filter(slot => {
        const slotNumber = parseInt(slot.replace('Jam ke-', ''));
        return slotNumber <= maxPeriod;
      });

      console.log(`Valid periods (max ${maxPeriod}): ${validPeriods.join(', ')}`);

      // Check existing exams
      const existingExams = await client.execute({
        sql: 'SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?',
        args: [umarClass.id, tomorrowKey]
      });

      console.log(`Existing exams for ${tomorrowKey}: ${existingExams.rows.length}`);

      // Calculate available slots
      const bookedPeriods = existingExams.rows.map(exam => exam.exam_period).filter(Boolean);
      const availableSlots = validPeriods.filter(period => !bookedPeriods.includes(period));

      console.log(`Booked periods: ${bookedPeriods.join(', ') || 'None'}`);
      console.log(`Available slots: ${availableSlots.length}`);
      availableSlots.forEach(slot => {
        console.log(`  ✅ ${slot}`);
      });

      if (availableSlots.length > 0) {
        console.log('\n🎯 SUCCESS: Slots are available for exam scheduling!');
        console.log('📝 Next steps:');
        console.log('1. Refresh the web application');
        console.log('2. Navigate to the umar class');
        console.log('3. Try to schedule an exam for the student');
        console.log('4. The slot picker should show these available slots');
      } else {
        console.log('\n⚠️  No slots available for this date');
      }

    } else {
      console.log(`❌ No schedule found for ${tomorrowDay}`);
    }

  } catch (error) {
    console.error('❌ Error adding test student:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the script
addTestStudent().then(() => {
  console.log('\n🏁 Script complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});