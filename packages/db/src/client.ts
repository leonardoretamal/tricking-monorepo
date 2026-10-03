import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }
  return drizzle(neon(url));
}
