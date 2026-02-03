// scripts/add-max-exams-per-day.ts
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Load env file manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key] = value;
    }
  });
}

const DB_URL = process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const AUTH_TOKEN = process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!DB_URL || !AUTH_TOKEN) {
  throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
}

const client = createClient({
  url: DB_URL,
  authToken: AUTH_TOKEN,
});

async function addMaxExamsPerDayColumn() {
  console.log('Adding max_exams_per_day column to penguji table...');

  // Add the new column (INTEGER nullable)
  await client.execute(`
    ALTER TABLE penguji ADD COLUMN max_exams_per_day INTEGER
  `);

  console.log('Column added successfully.');
  console.log('max_exams_per_day is nullable - leaving it NULL means unlimited exams per day.');
  console.log('Done!');
  process.exit(0);
}

addMaxExamsPerDayColumn().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
