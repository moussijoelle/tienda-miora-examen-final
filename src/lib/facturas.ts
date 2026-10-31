import pool from './db'

export interface Factura {
  pk_factura: number
  fk_cliente: string
  fecha_compra: Date
  stripe_payment_intent_id: string
  iva: number
}

export interface LineaDetalle {
  fk_factura: number
  fk_producto: number
  cantidad: number
  precio_unitario: number
  precio_total: number
  descuento: number
  iva: number
}

export interface LineaNueva {
  fkProducto: number
  cantidad: number
  precioUnitario: number
  descuento?: number
  iva?: number
}

export interface FacturaNueva {
  fkCliente: string
  stripePaymentIntentId: string
  iva?: number
  lineas: LineaNueva[]
}

export async function crearFactura(datos: FacturaNueva): Promise<Factura | null> {
  if (!datos.lineas.length) {
    return null
  }

  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')

    const { rows } = await cliente.query<Factura>(
      `INSERT INTO facturas (fk_cliente, stripe_payment_intent_id, iva)
       VALUES ($1, $2, $3)
       RETURNING pk_factura, fk_cliente, fecha_compra, stripe_payment_intent_id, iva`,
      [datos.fkCliente, datos.stripePaymentIntentId, datos.iva ?? 21],
    )

    const factura = rows[0]
    if (!factura) {
      throw new Error('No se pudo crear la factura')
    }

    for (const linea of datos.lineas) {
      await cliente.query(
        `INSERT INTO detalle_factura
           (fk_factura, fk_producto, cantidad, precio_unitario, descuento, iva)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          factura.pk_factura,
          linea.fkProducto,
          linea.cantidad,
          linea.precioUnitario,
          linea.descuento ?? 0,
          linea.iva ?? 21,
        ],
      )
    }

    await cliente.query('COMMIT')
    return factura
  } catch (error) {
    await cliente.query('ROLLBACK')
    console.error('Error creando factura:', error)
    return null
  } finally {
    cliente.release()
  }
}

export async function getFactura(pkFactura: number): Promise<{
  factura: Factura
  lineas: LineaDetalle[]
} | null> {
  try {
    const { rows: facturas } = await pool.query<Factura>(
      `SELECT pk_factura, fk_cliente, fecha_compra, stripe_payment_intent_id, iva
       FROM facturas
       WHERE pk_factura = $1`,
      [pkFactura],
    )

    const factura = facturas[0]
    if (!factura) {
      return null
    }

    const { rows: lineas } = await pool.query<LineaDetalle>(
      `SELECT fk_factura, fk_producto, cantidad, precio_unitario,
              precio_total, descuento, iva
       FROM detalle_factura
       WHERE fk_factura = $1
       ORDER BY fk_producto ASC`,
      [pkFactura],
    )

    return { factura, lineas }
  } catch (error) {
    console.error('Error consultando factura:', error)
    return null
  }
}
