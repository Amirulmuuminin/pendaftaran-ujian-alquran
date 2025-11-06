// Fix schedule format in database
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://quran-exam-db-amirulmuuminin.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjIzOTY2NDEsImlkIjoiZDNjZDAxNTUtNGRkYi00MmUzLWE5MzctMGZlMTY0OTBjY2M1IiwicmlkIjoiZjBjYzkxYTctZTI2Ni00NDdiLWIxMDQtNDc1NTdjMDQwMWQ5In0.hkce2qYrBXcTuG6rCc4d8ADDHel6aFvgDvznYbWgpwaRIr39DseatbwpVKNeVy9WKQLv18LniAs3tFs3bC12Ag',
});

async function fixScheduleFormat() {
  try {
    // Get all classes
    const classes = await client.execute('SELECT id, name, schedule FROM classes');
    console.log('Found classes:', classes.rows.length);

    for (const cls of classes.rows) {
      console.log(`Fixing schedule for class: ${cls.name}`);

      // Parse and convert schedule format
      const oldSchedule = JSON.parse(cls.schedule);
      const newSchedule = {};

      // Convert numbers to strings with "Jam ke-X" format
      Object.keys(oldSchedule).forEach(day => {
        newSchedule[day.toLowerCase()] = oldSchedule[day].map(num => `Jam ke-${num}`);
      });

      // Update database
      await client.execute({
        sql: 'UPDATE classes SET schedule = ? WHERE id = ?',
        args: [JSON.stringify(newSchedule), cls.id]
      });

      console.log('Updated schedule:', JSON.stringify(newSchedule));
      console.log('');
    }

    console.log('✅ Schedule format fixed for all classes!');

    // Verify the update
    const verify = await client.execute('SELECT id, name, schedule FROM classes LIMIT 2');
    verify.rows.forEach(cls => {
      console.log(`\nVerified class: ${cls.name}`);
      console.log('New schedule:', cls.schedule);
    });

  } catch (error) {
    console.error('❌ Error fixing schedule:', error);
  }
}

fixScheduleFormat();