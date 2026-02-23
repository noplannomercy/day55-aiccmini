import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Singleton pattern to prevent multiple connections during Next.js hot reload
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined
}

const client = postgres(connectionString, { max: 1, ssl: 'require' })
export const db = globalForDb.db ?? drizzle(client, { schema })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
