import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  const decoded = await verifyJwt(token)

  if (!decoded) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  console.log('LOGIN ->', pathname)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', // páginas protegidas
    '/clients/:path*', // páginas protegidas
    '/products/:path*', // páginas protegidas
    '/chips/:path*', // páginas protegidas
    '/groups/:path*', // páginas protegidas
    // '/api/:path*', // APIs protegidas
  ],
}
