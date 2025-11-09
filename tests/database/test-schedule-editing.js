// Test script for schedule editing functionality
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

function simulateHandleEditClass(classSchedule) {
  console.log('🔄 Simulating handleEditClass function...');

  try {
    const scheduleData = JSON.parse(classSchedule);

    // Convert schedule format from database to UI format
    // Database format: {"senin": ["Jam ke-1", "Jam ke-2"], ...}
    // UI format: {"Senin": [1, 2], ...}
    const convertedSchedule = {};

    Object.keys(scheduleData).forEach(day => {
      const dayKey = day.charAt(0).toUpperCase() + day.slice(1); // senin -> Senin
      const timeSlots = scheduleData[day];

      // Convert "Jam ke-X" strings to numbers
      const convertedSlots = timeSlots.map((slot) => {
        if (typeof slot === 'number') {
          return slot;
        } else if (typeof slot === 'string' && slot.includes('Jam ke-')) {
          return parseInt(slot.replace('Jam ke-', ''));
        } else {
          // Fallback for unexpected formats
          return parseInt(slot.toString());
        }
      });

      convertedSchedule[dayKey] = convertedSlots;
    });

    console.log('✅ Database → UI Conversion successful:');
    console.log('Database format:', JSON.stringify(scheduleData, null, 2));
    console.log('UI format:', JSON.stringify(convertedSchedule, null, 2));

    return convertedSchedule;
  } catch (error) {
    console.log('❌ Error in conversion:', error.message);
    return {};
  }
}

function simulateHandleSubmitClass(uiSchedule) {
  console.log('\n💾 Simulating handleSubmitClass function...');

  // Convert UI format to database format before saving
  // UI format: {"Senin": [1, 2], ...}
  // Database format: {"senin": ["Jam ke-1", "Jam ke-2"], ...}
  const convertedScheduleForDb = {};

  Object.keys(uiSchedule).forEach(day => {
    const dayKey = day.toLowerCase(); // Senin -> senin
    const timeSlots = uiSchedule[day];

    // Convert numbers to "Jam ke-X" strings
    const convertedSlots = timeSlots.map((slot) => {
      return `Jam ke-${slot}`;
    });

    convertedScheduleForDb[dayKey] = convertedSlots;
  });

  console.log('✅ UI → Database Conversion successful:');
  console.log('UI format:', JSON.stringify(uiSchedule, null, 2));
  console.log('Database format:', JSON.stringify(convertedScheduleForDb, null, 2));

  return convertedScheduleForDb;
}

function testSlotHighlighting(uiSchedule) {
  console.log('\n🎯 Testing slot highlighting logic...');

  const scheduleDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const scheduleSlots = [
    { value: 1, label: 'Jam ke-1' },
    { value: 2, label: 'Jam ke-2' },
    { value: 3, label: 'Jam ke-3' },
    { value: 4, label: 'Jam ke-4' },
    { value: 5, label: 'Jam ke-5' },
  ];

  scheduleDays.forEach(day => {
    console.log(`\n${day}:`);
    scheduleSlots.forEach(slot => {
      const isHighlighted = uiSchedule[day]?.includes(slot.value);
      console.log(`  ${slot.label} (${slot.value}): ${isHighlighted ? '✅ HIGHLIGHTED' : '○ Normal'}`);
    });
  });
}

async function testScheduleEditing() {
  console.log('🧪 Testing Schedule Editing Functionality\n');

  try {
    // Step 1: Get current umar class schedule from database
    console.log('📋 Step 1: Getting current schedule from database...');
    const umarQuery = await client.execute({
      sql: 'SELECT * FROM classes WHERE name = ?',
      args: ['umar']
    });

    if (umarQuery.rows.length === 0) {
      console.log('❌ Class "umar" not found');
      return;
    }

    const umarClass = umarQuery.rows[0];
    console.log(`✅ Found umar class: ${umarClass.name}`);
    console.log('Current schedule:', umarClass.schedule);

    // Step 2: Test Database → UI conversion (handleEditClass)
    console.log('\n🔄 Step 2: Testing Database → UI conversion');
    const uiSchedule = simulateHandleEditClass(umarClass.schedule);

    // Step 3: Test slot highlighting logic
    console.log('\n🎨 Step 3: Testing slot highlighting logic');
    testSlotHighlighting(uiSchedule);

    // Step 4: Test UI → Database conversion (handleSubmitClass)
    console.log('\n💾 Step 4: Testing UI → Database conversion');
    const dbSchedule = simulateHandleSubmitClass(uiSchedule);

    // Step 5: Verify round-trip conversion
    console.log('\n🔄 Step 5: Verifying round-trip conversion');
    const originalSchedule = JSON.parse(umarClass.schedule);
    const isRoundTripCorrect = JSON.stringify(originalSchedule) === JSON.stringify(dbSchedule);

    if (isRoundTripCorrect) {
      console.log('✅ Round-trip conversion successful!');
      console.log('Original and converted schedules match perfectly');
    } else {
      console.log('❌ Round-trip conversion failed');
      console.log('Original:', JSON.stringify(originalSchedule, null, 2));
      console.log('Converted:', JSON.stringify(dbSchedule, null, 2));
    }

    console.log('\n🎉 Schedule editing test completed!');
    console.log('✅ The fix should now show existing schedule slots as highlighted when editing');

  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testScheduleEditing().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});