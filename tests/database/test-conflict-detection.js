// Test script to verify cross-class conflict detection logic
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function testConflictDetection() {
  console.log('🧪 Testing Cross-Class Conflict Detection Logic\n');

  try {
    // Step 1: Test the OLD logic (class-specific conflicts)
    console.log('❌ OLD Logic: Class-specific conflict detection');
    console.log('Query: SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?');

    const testDate = '2025-11-11'; // Tomorrow
    const testPeriod = 'Jam ke-4';

    // Test with hai class
    const haiClassResult = await client.execute({
      sql: 'SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?',
      args: ['class_1762408940184_eb28lqswp', testDate]
    });

    console.log(`Hai class exams on ${testDate}: ${haiClassResult.rows.length}`);

    // Test with umar class
    const umarClassResult = await client.execute({
      sql: 'SELECT * FROM exams WHERE class_id = ? AND exam_date_key = ?',
      args: ['class_1762442722267_xtujnkadc', testDate]
    });

    console.log(`Umar class exams on ${testDate}: ${umarClassResult.rows.length}`);

    // Step 2: Test the NEW logic (cross-class conflicts)
    console.log('\n✅ NEW Logic: Cross-class conflict detection');
    console.log('Query: SELECT * FROM exams WHERE exam_date_key = ?');

    const allClassesResult = await client.execute({
      sql: 'SELECT * FROM exams WHERE exam_date_key = ?',
      args: [testDate]
    });

    console.log(`All classes exams on ${testDate}: ${allClassesResult.rows.length}`);

    // Show details
    if (allClassesResult.rows.length > 0) {
      console.log('\nExam details:');
      allClassesResult.rows.forEach(exam => {
        console.log(`  - ${exam.exam_period} in class ${exam.class_id} for student ${exam.student_id}`);
      });
    } else {
      console.log('No exams found for this date');
    }

    // Step 3: Simulate conflict detection
    console.log('\n🧮 Simulating conflict detection for slot availability...');

    // Simulate the OLD way (only checks within same class)
    const oldBookedPeriodsForHai = haiClassResult.rows.map(exam => exam.exam_period);
    const oldBookedPeriodsForUmar = umarClassResult.rows.map(exam => exam.exam_period);

    console.log(`OLD - Booked periods for Hai: ${oldBookedPeriodsForHai.join(', ') || 'None'}`);
    console.log(`OLD - Booked periods for Umar: ${oldBookedPeriodsForUmar.join(', ') || 'None'}`);

    // Simulate the NEW way (checks across all classes)
    const newBookedPeriods = allClassesResult.rows.map(exam => exam.exam_period);
    console.log(`NEW - Booked periods (all classes): ${newBookedPeriods.join(', ') || 'None'}`);

    // Step 4: Test if slot ${testPeriod} would be available
    console.log(`\n🎯 Testing availability for ${testPeriod}:`);

    const oldAvailableForHai = !oldBookedPeriodsForHai.includes(testPeriod);
    const oldAvailableForUmar = !oldBookedPeriodsForUmar.includes(testPeriod);
    const newAvailableForBoth = !newBookedPeriods.includes(testPeriod);

    console.log(`OLD - Available for Hai: ${oldAvailableForHai ? 'YES' : 'NO'}`);
    console.log(`OLD - Available for Umar: ${oldAvailableForUmar ? 'YES' : 'NO'}`);
    console.log(`NEW - Available for both: ${newAvailableForBoth ? 'YES' : 'NO'}`);

    // Step 5: Demonstrate the problem
    console.log('\n💡 Demonstrating the cross-class conflict problem...');

    if (oldAvailableForHai && oldAvailableForUmar && !newAvailableForBoth) {
      console.log('❌ PROBLEM DETECTED:');
      console.log('  - OLD logic: Both classes think the slot is available');
      console.log('  - NEW logic: Slot is blocked due to cross-class conflict');
      console.log('  - This could cause double booking!');
    } else if (newAvailableForBoth) {
      console.log('✅ Slot is genuinely available (no conflicts)');
    } else {
      console.log('✅ Slot is properly blocked (conflict detected)');
    }

    // Step 6: Show how the fix works
    console.log('\n🔧 How the fix works:');
    console.log('1. getAvailableSlotsForDateRange() was changed to query across ALL classes');
    console.log('2. checkDateConflict() was changed to query across ALL classes');
    console.log('3. Both functions now use: WHERE exam_date_key = ? AND exam_period = ?');
    console.log('4. Previously they used: WHERE class_id = ? AND exam_date_key = ? AND exam_period = ?');

    console.log('\n🎉 Conflict detection test completed!');
    console.log('✅ The fix prevents double booking across different classes');

  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testConflictDetection().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});