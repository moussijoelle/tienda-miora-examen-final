import pool from './db'

export interface Cliente {
  pk_cliente: string
  email: string
  tipo: string
  razon_social: string | null
  nombres_cliente: string
  apellido1_cliente: string
  apellido2_cliente: string | null
  telefono_movil: string | null
  rol: string
  fecha_registro: Date
}

export async function getDatosCliente(email: string): Promise<Cliente | null> {
  try {
    const { rows } = await pool.query<Cliente>(
      `SELECT pk_cliente, email, tipo, razon_social,
              nombres_cliente, apellido1_cliente, apellido2_cliente,
              telefono_movil, rol, fecha_registro
       FROM clientes
       WHERE email = $1`,
      [email],
    )
    return rows[0] ?? null
  } catch (error) {
    console.error('Error consultando cliente:', error)
    return null
  }
}

export async function getClienteById(pkCliente: string): Promise<Cliente | null> {
  try {
    const { rows } = await pool.query<Cliente>(
      `SELECT pk_cliente, email, tipo, razon_social,
              nombres_cliente, apellido1_cliente, apellido2_cliente,
              telefono_movil, rol, fecha_registro
       FROM clientes
       WHERE pk_cliente = $1`,
      [pkCliente],
    )
    return rows[0] ?? null
  } catch (error) {
    console.error('Error consultando cliente por id:', error)
    return null
  }
}
