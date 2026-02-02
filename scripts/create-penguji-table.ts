// scripts/create-penguji-table.ts
import client from '../lib/db';

async function createPengujiTable() {
  console.log('Creating penguji table...');

  // Create table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS penguji (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      schedule TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  console.log('Table created successfully.');

  // Check if Ustadz Nawir already exists
  const existing = await client.execute({
    sql: "SELECT * FROM penguji WHERE name = ?",
    args: ['Ustadz Nawir']
  });

  if (existing.rows.length === 0) {
    // Insert default examiner
    const defaultSchedule = JSON.stringify({
      senin: ["Jam ke-1", "Jam ke-2", "Jam ke-3", "Jam ke-4", "Jam ke-5"],
      selasa: ["Jam ke-1", "Jam ke-2", "Jam ke-3", "Jam ke-4"],
      rabu: ["Jam ke-1", "Jam ke-2", "Jam ke-3", "Jam ke-4"],
      kamis: ["Jam ke-1", "Jam ke-2", "Jam ke-3", "Jam ke-4", "Jam ke-5"],
      jumat: ["Jam ke-1", "Jam ke-2", "Jam ke-3", "Jam ke-4", "Jam ke-5"]
    });

    await client.execute({
      sql: "INSERT INTO penguji (id, name, schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      args: ['penguji_default', 'Ustadz Nawir', defaultSchedule, 1704200000, 1704200000]
    });

    console.log('Default examiner Ustadz Nawir inserted.');
  } else {
    console.log('Ustadz Nawir already exists, skipping insert.');
  }

  console.log('Done!');
  process.exit(0);
}

createPengujiTable().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
