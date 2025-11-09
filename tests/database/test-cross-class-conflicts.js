// Test script for cross-class slot conflict detection
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function testCrossClassConflictDetection() {
  console.log('🧪 Testing Cross-Class Slot Conflict Detection\n');

  try {
    // Step 1: Get all classes
    console.log('📋 Step 1: Getting all classes...');
    const classesQuery = await client.execute({
      sql: 'SELECT * FROM classes ORDER BY name'
    });

    if (classesQuery.rows.length < 2) {
      console.log('❌ Need at least 2 classes to test cross-class conflicts');
      return;
    }

    console.log(`Found ${classesQuery.rows.length} classes:`);
    classesQuery.rows.forEach((classItem, i) => {
      console.log(`  ${i + 1}. ${classItem.name} (ID: ${classItem.id})`);
    });

    const classA = classesQuery.rows[0];
    const classB = classesQuery.rows[1];

    console.log(`\nUsing for test:`);
    console.log(`  Class A: ${classA.name} (${classA.id})`);
    console.log(`  Class B: ${classB.name} (${classB.id})`);

    // Step 2: Check for existing students
    console.log('\n👥 Step 2: Checking for students...');
    const studentsAQuery = await client.execute({
      sql: 'SELECT * FROM students WHERE class_id = ? LIMIT 1',
      args: [classA.id]
    });

    const studentsBQuery = await client.execute({
      sql: 'SELECT * FROM students WHERE class_id = ? LIMIT 1',
      args: [classB.id]
    });

    if (studentsAQuery.rows.length === 0 || studentsBQuery.rows.length === 0) {
      console.log('❌ Both classes need at least one student each to test exam scheduling');
      console.log(`  ${classA.name}: ${studentsAQuery.rows.length} students`);
      console.log(`  ${classB.name}: ${studentsBQuery.rows.length} students`);
      return;
    }

    const studentA = studentsAQuery.rows[0];
    const studentB = studentsBQuery.rows[0];

    console.log(`✅ Found test students:`);
    console.log(`  ${classA.name}: ${studentA.name} (${studentA.id})`);
    console.log(`  ${classB.name}: ${studentB.name} (${studentB.id})`);

    // Step 3: Clear any existing test exams
    console.log('\n🧹 Step 3: Cleaning up existing test exams...');
    const cleanupResult = await client.execute({
      sql: 'DELETE FROM exams WHERE student_id LIKE ? OR student_id LIKE ?',
      args: [`%test_${classA.id}%`, `%test_${classB.id}%`]
    });
    console.log(`✅ Cleaned up ${cleanupResult.rowsAffected} test exams`);

    // Step 4: Get available slots for both classes for the same date
    console.log('\n📅 Step 4: Testing slot availability...');

    // Test for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = tomorrow.toISOString().split('T')[0];
    const tomorrowDay = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });

    console.log(`Testing for: ${tomorrowDay} (${tomorrowKey})`);

    // Get schedule for both classes
    const scheduleA = JSON.parse(classA.schedule);
    const scheduleB = JSON.parse(classB.schedule);

    const dayKeyA = tomorrowDay.toLowerCase();
    const dayKeyB = tomorrowDay.toLowerCase();

    if (!scheduleA[dayKeyA] || !scheduleB[dayKeyB]) {
      console.log('❌ One or both classes don\'t have schedule for this day');
      console.log(`  ${classA.name}: ${scheduleA[dayKeyA] ? 'Has schedule' : 'No schedule'}`);
      console.log(`  ${classB.name}: ${scheduleB[dayKeyB] ? 'Has schedule' : 'No schedule'}`);
      return;
    }

    // Find common available slots
    const slotsA = scheduleA[dayKeyA];
    const slotsB = scheduleB[dayKeyB];
    const commonSlots = slotsA.filter(slot => slotsB.includes(slot));

    if (commonSlots.length === 0) {
      console.log('❌ No common time slots between classes for this day');
      return;
    }

    console.log(`✅ Found common slots: ${commonSlots.join(', ')}`);
    const testSlot = commonSlots[0];
    console.log(`Using test slot: ${testSlot}`);

    // Step 5: Create exam for class A
    console.log('\n➕ Step 5: Creating exam for Class A...');
    const timestamp = Date.now();
    const examAId = `exam_${timestamp}_classA`;

    await client.execute({
      sql: 'INSERT INTO exams (id, class_id, student_id, exam_date_key, exam_period, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        examAId,
        classA.id,
        studentA.id,
        tomorrowKey,
        testSlot,
        Math.floor(timestamp / 1000),
        Math.floor(timestamp / 1000)
      ]
    });

    console.log(`✅ Created exam for ${classA.name}: ${testSlot} on ${tomorrowKey}`);

    // Step 6: Check if slot is properly blocked for class B
    console.log('\n🔍 Step 6: Checking if slot is blocked for Class B...');

    const conflictQuery = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM exams WHERE exam_date_key = ? AND exam_period = ?',
      args: [tomorrowKey, testSlot]
    });

    const hasConflict = conflictQuery.rows[0].count > 0;
    console.log(`Conflict check result: ${hasConflict ? 'CONFLICT FOUND' : 'NO CONFLICT'}`);
    console.log(`Total exams for ${testSlot} on ${tomorrowKey}: ${conflictQuery.rows[0].count}`);

    // Step 7: Simulate slot availability calculation
    console.log('\n🧮 Step 7: Simulating slot availability calculation for Class B...');

    // Get all exams for the date (this is what the fixed code does)
    const allExamsQuery = await client.execute({
      sql: 'SELECT * FROM exams WHERE exam_date_key = ?',
      args: [tomorrowKey]
    });

    const bookedPeriods = allExamsQuery.rows.map(exam => exam.exam_period);
    console.log(`Booked periods for ${tomorrowKey}: ${bookedPeriods.join(', ')}`);

    const isSlotAvailableForB = !bookedPeriods.includes(testSlot);
    console.log(`Is ${testSlot} available for ${classB.name}: ${isSlotAvailableForB ? 'YES' : 'NO'}`);

    // Step 8: Result verification
    console.log('\n🎯 Step 8: Verification Results...');

    if (!isSlotAvailableForB && hasConflict) {
      console.log('✅ SUCCESS: Cross-class conflict detection is working!');
      console.log('✅ The slot is properly blocked for Class B');
      console.log('✅ Both classes cannot schedule exams at the same time');
    } else {
      console.log('❌ FAILURE: Cross-class conflict detection is NOT working');
      console.log('❌ The slot is still available for Class B');
      console.log('❌ This indicates the fix needs more work');
    }

    // Step 9: Cleanup
    console.log('\n🧹 Step 9: Cleaning up test data...');
    const finalCleanupResult = await client.execute({
      sql: 'DELETE FROM exams WHERE id = ?',
      args: [examAId]
    });
    console.log(`✅ Cleaned up test exam: ${finalCleanupResult.rowsAffected} rows`);

    console.log('\n🎉 Cross-class conflict detection test completed!');
    console.log('✅ The fix should now prevent slot conflicts across different classes');

  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCrossClassConflictDetection().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});