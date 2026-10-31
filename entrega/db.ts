import { Pool, type PoolClient, type QueryResultRow } from 'pg'

export interface Categoria {
  pk_categoria: string
  nom_categoria: string
  descripcion_categoria: string | null
}

const cadena = (import.meta.env.DATABASE_URL as string | undefined) ?? process.env.DATABASE_URL

const pool = new Pool({
  connectionString: cadena,
  // En Supabase hosted el cable va con SSL. En Postgres de casa, si lo enciendo, peta.
  ssl: cadena?.includes('supabase') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 4000,
  idleTimeoutMillis: 10000,
})

function dormir(ms: number) {
  return new Promise((ok) => setTimeout(ok, ms))
}

async function consultar<T extends QueryResultRow>(sql: string, valores: unknown[] = []): Promise<T[]> {
  if (!cadena) {
    throw new Error('Falta DATABASE_URL')
  }

  let espera = 200
  let ultimo: unknown

  for (let intento = 1; intento <= 3; intento++) {
    let cliente: PoolClient | undefined
    try {
      cliente = await pool.connect()
      const { rows } = await cliente.query<T>(sql, valores)
      return rows
    } catch (err) {
      ultimo = err
      if (intento === 3) break
      await dormir(espera)
      espera *= 2
    } finally {
      cliente?.release()
    }
  }

  throw ultimo
}

export async function listarCategorias(): Promise<Categoria[]> {
  return consultar<Categoria>(
    `SELECT pk_categoria, nom_categoria, descripcion_categoria
     FROM categorias
     ORDER BY nom_categoria`,
  )
}

export async function buscarCategoria(pk: string): Promise<Categoria | null> {
  const filas = await consultar<Categoria>(
    `SELECT pk_categoria, nom_categoria, descripcion_categoria
     FROM categorias
     WHERE pk_categoria = $1`,
    [pk],
  )
  return filas[0] ?? null
}
