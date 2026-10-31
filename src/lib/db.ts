import { Pool } from 'pg'

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
})

export default pool
