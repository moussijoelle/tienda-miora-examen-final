import type { APIRoute } from 'astro'
import pool from '@/lib/db'
import { supabase } from '@/lib/supabase'

export const prerender = false

function partirNombre(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) {
    return { nombres: 'Cliente', apellido1: 'Miora', razonSocial: 'Cliente Miora' }
  }
  if (partes.length === 1) {
    return { nombres: partes[0], apellido1: partes[0], razonSocial: partes[0] }
  }
  return {
    nombres: partes[0],
    apellido1: partes.slice(1).join(' '),
    razonSocial: nombreCompleto.trim(),
  }
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData()
  const nombre = formData.get('nombre')?.toString() || ''
  const nombresCampo = formData.get('nombres')?.toString()?.trim() || ''
  const apellido1Campo = formData.get('apellido1')?.toString()?.trim() || ''
  const telefono = formData.get('telefono')?.toString() || ''
  const enviarBrevo = formData.get('enviar-brevo')?.toString() === 'true'

  const accessToken = cookies.get('sb-access-token')
  const refreshToken = cookies.get('sb-refresh-token')

  if (!accessToken || !refreshToken) {
    return new Response('No autorizado', { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  })

  if (authError || !user) {
    return new Response('Sesión inválida', { status: 401 })
  }

  const { nombres, apellido1, razonSocial } =
    nombresCampo && apellido1Campo
      ? {
          nombres: nombresCampo,
          apellido1: apellido1Campo,
          razonSocial: `${nombresCampo} ${apellido1Campo}`.trim(),
        }
      : partirNombre(nombre)

  const textQuery = `
    INSERT INTO clientes (
      pk_cliente, email, tipo, razon_social,
      nombres_cliente, apellido1_cliente, telefono_movil, rol
    )
    VALUES ($1, $2, 'autonomo', $3, $4, $5, $6, 'cliente')
    ON CONFLICT (pk_cliente) DO UPDATE
    SET nombres_cliente = EXCLUDED.nombres_cliente,
        apellido1_cliente = EXCLUDED.apellido1_cliente,
        telefono_movil = EXCLUDED.telefono_movil,
        razon_social = EXCLUDED.razon_social,
        email = EXCLUDED.email;
  `

  const values = [user.id, user.email, razonSocial, nombres, apellido1, telefono || null]

  try {
    await pool.query(textQuery, values)
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error SQL:', err)
    return new Response(`Error en Base de Datos: ${mensaje}`, { status: 500 })
  }

  if (enviarBrevo && user.email) {
    await enviarABrevo(user.email, nombre, telefono)
  }

  return redirect('/perfil')
}

async function enviarABrevo(email: string, nombre: string, telefono: string) {
  const BREVO_API_KEY = import.meta.env.BREVO_API_KEY

  if (!BREVO_API_KEY) return

  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      email: email,
      attributes: {
        NOMBRE: nombre,
        TELEFONO: telefono,
      },
      updateEnabled: true,
    }),
  })
}
