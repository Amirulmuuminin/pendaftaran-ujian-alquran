// scripts/add-supported-exam-types.ts
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

async function addSupportedExamTypesColumn() {
  console.log('Adding supported_exam_types column to penguji table...');

  // Add the new column
  await client.execute(`
    ALTER TABLE penguji ADD COLUMN supported_exam_types TEXT
  `);

  console.log('Column added successfully.');

  // Update existing pengujis with default values
  // Ustadz Nawir handles both full and half
  await client.execute({
    sql: "UPDATE penguji SET supported_exam_types = ? WHERE name = ?",
    args: [JSON.stringify(['full', 'half']), 'Ustadz Nawir']
  });

  console.log('Ustadz Nawir updated to support both full and half juz exams.');

  // For any other existing pengujis, set default to both
  const result = await client.execute("SELECT * FROM penguji WHERE supported_exam_types IS NULL");
  for (const penguji of result.rows) {
    await client.execute({
      sql: "UPDATE penguji SET supported_exam_types = ? WHERE id = ?",
      args: [JSON.stringify(['full', 'half']), penguji.id]
    });
  }

  console.log('All existing pengujis updated with default supported exam types.');
  console.log('Done!');
  process.exit(0);
}

addSupportedExamTypesColumn().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
