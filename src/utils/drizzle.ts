import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = () => {
    const client = drizzle(process.env.DATABASE_URL!)
    return client;
}