import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

export const prerender = false

interface LineaCesta {
  id: number
  nombre: string
  precio: number
  imagen?: string
  talla?: string
  cantidad: number
}

function getStripe() {
  const apiKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('Falta STRIPE_SECRET_KEY en el archivo .env')
  }
  return new Stripe(apiKey)
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const stripe = getStripe()

    const accessToken = cookies.get('sb-access-token')
    const refreshToken = cookies.get('sb-refresh-token')

    let userId: string | null = null

    if (accessToken && refreshToken) {
      const { data } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value,
      })
      if (data.user) {
        userId = data.user.id
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Debes iniciar sesión para comprar.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const body = (await request.json()) as { items?: LineaCesta[] }
    const items = body.items

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'El carrito está vacío' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const lineItems = items.map((item) => {
      const nombre =
        item.talla && item.talla.length > 0
          ? `${item.nombre} (Talla ${item.talla})`
          : item.nombre

      return {
        price_data: {
          currency: 'eur' as const,
          product_data: {
            name: nombre,
          },
          unit_amount: Math.round(Number(item.precio) * 100),
        },
        quantity: item.cantidad || 1,
      }
    })

    const cartMeta = JSON.stringify(
      items.map((item) => ({
        id: item.id,
        cantidad: item.cantidad || 1,
        precio: Number(item.precio),
      })),
    )

    const origin = new URL(request.url).origin

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrito`,
      metadata: {
        userId,
        cart: cartMeta,
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en /api/crear-checkout:', error)
    return new Response(JSON.stringify({ error: mensaje }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
