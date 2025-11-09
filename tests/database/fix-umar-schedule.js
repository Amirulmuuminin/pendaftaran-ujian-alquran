// Fix script for umar class schedule format issue
import { createClient } from '@libsql/client';

// Database connection
const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function fixUmarSchedule() {
  console.log('🔧 Fixing umar class schedule format...\n');

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
    console.log(`Current schedule: ${umarClass.schedule}\n`);

    // Step 2: Parse and fix the schedule
    console.log('🔨 Step 2: Fixing schedule format...');
    let oldSchedule;
    try {
      oldSchedule = JSON.parse(umarClass.schedule);
      console.log('Current format:');
      console.log(JSON.stringify(oldSchedule, null, 2));
    } catch (error) {
      console.log('❌ Failed to parse current schedule:', error.message);
      return;
    }

    // Create corrected schedule
    const newSchedule = {};
    const dayMapping = {
      'Senin': 'senin',
      'Selasa': 'selasa',
      'Rabu': 'rabu',
      'Kamis': 'kamis',
      'Jumat': 'jumat'
    };

    Object.keys(oldSchedule).forEach(day => {
      const correctedDay = dayMapping[day] || day.toLowerCase();
      const timeSlots = oldSchedule[day];

      // Convert numbers to "Jam ke-X" format
      const correctedSlots = timeSlots.map(slot => {
        if (typeof slot === 'number') {
          return `Jam ke-${slot}`;
        } else if (typeof slot === 'string' && slot.includes('Jam ke-')) {
          return slot;
        } else {
          console.log(`⚠️  Unexpected slot format: ${slot}`);
          return slot;
        }
      });

      newSchedule[correctedDay] = correctedSlots;
    });

    console.log('\nCorrected format:');
    console.log(JSON.stringify(newSchedule, null, 2));

    // Step 3: Update the database
    console.log('\n💾 Step 3: Updating database...');
    const newScheduleJson = JSON.stringify(newSchedule);

    const updateResult = await client.execute({
      sql: 'UPDATE classes SET schedule = ? WHERE id = ?',
      args: [newScheduleJson, umarClass.id]
    });

    console.log(`✅ Updated ${updateResult.rowsAffected} rows`);

    // Step 4: Verify the fix
    console.log('\n✅ Step 4: Verifying the fix...');
    const verifyQuery = await client.execute({
      sql: 'SELECT schedule FROM classes WHERE id = ?',
      args: [umarClass.id]
    });

    const updatedSchedule = JSON.parse(verifyQuery.rows[0].schedule);
    console.log('Updated schedule in database:');
    console.log(JSON.stringify(updatedSchedule, null, 2));

    // Step 5: Test slot calculation
    console.log('\n🧮 Step 5: Testing slot calculation...');

    // Test for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.toLocaleDateString('id-ID', { weekday: 'long' });
    const tomorrowDayKey = tomorrowDay.toLowerCase();

    console.log(`Testing for: ${tomorrowDay} (${tomorrowDayKey})`);

    if (updatedSchedule[tomorrowDayKey]) {
      console.log(`Schedule for ${tomorrowDay}: ${updatedSchedule[tomorrowDayKey].join(', ')}`);

      // Apply day constraints
      const maxPeriod = (tomorrowDay === 'Selasa' || tomorrowDay === 'Rabu') ? 4 : 5;
      const validPeriods = updatedSchedule[tomorrowDayKey].filter(slot => {
        const slotNumber = parseInt(slot.replace('Jam ke-', ''));
        return slotNumber <= maxPeriod;
      });

      console.log(`Valid periods (max ${maxPeriod}): ${validPeriods.join(', ')}`);
      console.log(`✅ Slot calculation should now work! Available slots: ${validPeriods.length}`);
    } else {
      console.log(`⚠️  No schedule found for ${tomorrowDay}`);
    }

    console.log('\n🎉 Fix completed successfully!');
    console.log('The umar class should now be able to get exam schedules.');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the fix
fixUmarSchedule().then(() => {
  console.log('\n🏁 Fix script complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix script failed:', error);
  process.exit(1);
});