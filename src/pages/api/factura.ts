import type { APIRoute } from 'astro'
import { getDatosCliente, type Cliente } from '../../lib/clientes'
import { crearFactura, type Factura } from '../../lib/facturas'

export const prerender = false

interface LineaBody {
  id: number
  cantidad: number
  precio: number
  descuento?: number
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const cuerpo = (await request.json()) as {
      email?: string
      lineas?: LineaBody[]
    }

    const email = cuerpo.email?.trim() || '1moussijoelle@gmail.com'
    const lineas = cuerpo.lineas ?? []

    if (lineas.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Cesta vacía' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cliente: Cliente | null = await getDatosCliente(email)
    if (!cliente) {
      return new Response(JSON.stringify({ ok: false, error: 'Cliente no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const factura: Factura | null = await crearFactura({
      fkCliente: cliente.pk_cliente,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      iva: 21,
      lineas: lineas.map((linea) => ({
        fkProducto: linea.id,
        cantidad: linea.cantidad,
        precioUnitario: linea.precio,
        descuento: linea.descuento ?? 0,
        iva: 21,
      })),
    })

    if (!factura) {
      return new Response(JSON.stringify({ ok: false, error: 'No se pudo crear la factura' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        pk_factura: factura.pk_factura,
        stripe_payment_intent_id: factura.stripe_payment_intent_id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error en /api/factura:', error)
    return new Response(JSON.stringify({ ok: false, error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
