import pool from './db'

export interface Categoria {
  pk_categoria: string
  nom_categoria: string
  descripcion_categoria: string | null
}

let categoriasCache: Categoria[] | null = null

export async function getCategorias(): Promise<Categoria[]> {
  if (categoriasCache !== null) {
    return categoriasCache
  }

  try {
    const { rows } = await pool.query<Categoria>(
      `SELECT pk_categoria, nom_categoria, descripcion_categoria
       FROM categorias
       ORDER BY nom_categoria ASC`,
    )
    categoriasCache = rows
    return categoriasCache
  } catch (error) {
    console.error('Error consultando categorías en Supabase:', error)
    categoriasCache = []
    return categoriasCache
  }
}

export async function getCategoriaByPk(pk: string): Promise<Categoria | null> {
  try {
    const { rows } = await pool.query<Categoria>(
      `SELECT pk_categoria, nom_categoria, descripcion_categoria
       FROM categorias
       WHERE pk_categoria = $1`,
      [pk],
    )
    return rows[0] ?? null
  } catch (error) {
    console.error('Error consultando categoría:', error)
    return null
  }
}
