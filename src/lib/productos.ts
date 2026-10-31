import pool from './db'

export interface Producto {
  pk_producto: number
  fk_categoria: string
  nombre_producto: string
  url_imagen: string | null
  descripcion_producto: string | null
  precio: number
  descuento: number
}

export async function getProductosByCategoria(fkCategoria: string): Promise<Producto[]> {
  try {
    const { rows } = await pool.query<Producto>(
      `SELECT pk_producto, fk_categoria, nombre_producto, url_imagen,
              descripcion_producto, precio, descuento
       FROM productos
       WHERE fk_categoria = $1
         AND fecha_baja IS NULL
       ORDER BY nombre_producto ASC`,
      [fkCategoria],
    )
    return rows
  } catch (error) {
    console.error('Error consultando productos por categoría:', error)
    return []
  }
}

export async function getProductoById(id: number): Promise<Producto | null> {
  try {
    const { rows } = await pool.query<Producto>(
      `SELECT pk_producto, fk_categoria, nombre_producto, url_imagen,
              descripcion_producto, precio, descuento
       FROM productos
       WHERE pk_producto = $1`,
      [id],
    )
    return rows[0] ?? null
  } catch (error) {
    console.error('Error consultando producto por id:', error)
    return null
  }
}

export async function buscarProductos(texto: string): Promise<Producto[]> {
  try {
    const { rows } = await pool.query<Producto>(
      `SELECT p.pk_producto, p.fk_categoria, p.nombre_producto, p.url_imagen,
              p.descripcion_producto, p.precio, p.descuento
       FROM productos p
       LEFT JOIN categorias c ON c.pk_categoria = p.fk_categoria
       WHERE p.fecha_baja IS NULL
         AND (
           p.nombre_producto ILIKE $1
           OR p.descripcion_producto ILIKE $1
           OR c.nom_categoria ILIKE $1
         )
       ORDER BY p.nombre_producto ASC`,
      [`%${texto}%`],
    )
    return rows
  } catch (error) {
    console.error('Error buscando productos:', error)
    return []
  }
}

export async function getProductosEnRebaja(): Promise<Producto[]> {
  try {
    const { rows } = await pool.query<Producto>(
      `SELECT pk_producto, fk_categoria, nombre_producto, url_imagen,
              descripcion_producto, precio, descuento
       FROM productos
       WHERE descuento > 0
         AND fecha_baja IS NULL
       ORDER BY descuento DESC, nombre_producto ASC`,
    )
    return rows
  } catch (error) {
    console.error('Error consultando rebajas:', error)
    return []
  }
}
