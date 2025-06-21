import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../db/schema"
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });