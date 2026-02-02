import { createClient } from '@libsql/client';

if (!process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || !process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN) {
  throw new Error('Missing NEXT_PUBLIC_TURSO_DATABASE_URL or NEXT_PUBLIC_TURSO_AUTH_TOKEN environment variables');
}

const client = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL,
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
});

export default client;