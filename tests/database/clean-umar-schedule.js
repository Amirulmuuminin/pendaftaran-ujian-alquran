// Clean up duplicate schedule entries for umar class
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function cleanUmarSchedule() {
  console.log('🧹 Cleaning up duplicate entries in umar class schedule...\n');

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

    // Step 2: Parse and analyze current schedule
    console.log('\n🔍 Step 2: Analyzing current schedule...');
    let currentSchedule;
    try {
      currentSchedule = JSON.parse(umarClass.schedule);
      console.log('Current schedule structure:');
      console.log(JSON.stringify(currentSchedule, null, 2));
    } catch (error) {
      console.log('❌ Failed to parse current schedule:', error.message);
      return;
    }

    // Step 3: Identify and clean up duplicates
    console.log('\n🧽 Step 3: Cleaning up duplicate entries...');

    const cleanSchedule = {};
    const expectedDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];

    // Process each day, keeping only the correct lowercase version
    expectedDays.forEach(day => {
      // Check if lowercase version exists (correct format)
      if (currentSchedule[day]) {
        cleanSchedule[day] = currentSchedule[day];
        console.log(`✅ Keeping ${day}: ${currentSchedule[day].join(', ')}`);

        // Check if capitalized version also exists (duplicate)
        const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
        if (currentSchedule[capitalizedDay]) {
          console.log(`🗑️  Removing duplicate ${capitalizedDay}: ${currentSchedule[capitalizedDay].join(', ')}`);
        }
      } else {
        // If only capitalized version exists, convert it
        const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
        if (currentSchedule[capitalizedDay]) {
          const oldSlots = currentSchedule[capitalizedDay];
          const newSlots = oldSlots.map(slot => {
            if (typeof slot === 'number') {
              return `Jam ke-${slot}`;
            } else if (typeof slot === 'string' && slot.includes('Jam ke-')) {
              return slot;
            } else {
              return `Jam ke-${slot}`;
            }
          });

          cleanSchedule[day] = newSlots;
          console.log(`🔄 Converting ${capitalizedDay} → ${day}: ${newSlots.join(', ')}`);
        }
      }
    });

    console.log('\nCleaned schedule:');
    console.log(JSON.stringify(cleanSchedule, null, 2));

    // Step 4: Update database with clean schedule
    console.log('\n💾 Step 4: Updating database with clean schedule...');
    const cleanScheduleJson = JSON.stringify(cleanSchedule);

    const updateResult = await client.execute({
      sql: 'UPDATE classes SET schedule = ? WHERE id = ?',
      args: [cleanScheduleJson, umarClass.id]
    });

    console.log(`✅ Updated ${updateResult.rowsAffected} rows`);

    // Step 5: Verify the cleanup
    console.log('\n✅ Step 5: Verifying the cleanup...');
    const verifyQuery = await client.execute({
      sql: 'SELECT schedule FROM classes WHERE id = ?',
      args: [umarClass.id]
    });

    const cleanedSchedule = JSON.parse(verifyQuery.rows[0].schedule);
    console.log('Final schedule in database:');
    console.log(JSON.stringify(cleanedSchedule, null, 2));

    // Step 6: Test slot calculation with cleaned schedule
    console.log('\n🧮 Step 6: Testing slot calculation with cleaned schedule...');

    // Test for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });
    const tomorrowDayKey = tomorrowDay.toLowerCase();

    console.log(`Testing for: ${tomorrowDay} (${tomorrowDayKey})`);

    if (cleanedSchedule[tomorrowDayKey]) {
      console.log(`Schedule for ${tomorrowDay}: ${cleanedSchedule[tomorrowDayKey].join(', ')}`);

      // Apply day constraints
      const maxPeriod = (tomorrowDay === 'Selasa' || tomorrowDay === 'Rabu') ? 4 : 5;
      const validPeriods = cleanedSchedule[tomorrowDayKey].filter(slot => {
        const slotNumber = parseInt(slot.replace('Jam ke-', ''));
        return slotNumber <= maxPeriod;
      });

      console.log(`Valid periods (max ${maxPeriod}): ${validPeriods.join(', ')}`);
      console.log(`✅ Slot calculation working! Available slots: ${validPeriods.length}`);
    } else {
      console.log(`⚠️  No schedule found for ${tomorrowDay}`);
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('✅ All duplicate entries have been removed');
    console.log('✅ Schedule is now clean and consistent');
    console.log('✅ The umar class should now show correct slot availability');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the cleanup
cleanUmarSchedule().then(() => {
  console.log('\n🏁 Cleanup complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});