import type { APIRoute } from 'astro'
import { supabase } from '../../../lib/supabase'

export const prerender = false

function rutaSegura(ruta: string | null) {
  if (!ruta || !ruta.startsWith('/') || ruta.startsWith('//')) {
    return null
  }
  return ruta
}

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get('code')
  const next = rutaSegura(url.searchParams.get('next'))

  if (!authCode) {
    return redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  const { access_token, refresh_token } = data.session!

  cookies.set('sb-access-token', access_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
  })
  cookies.set('sb-refresh-token', refresh_token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
  })

  return redirect(next ?? '/')
}
