import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Senha inválida' }, { status: 401 })
  }

  const token = await signJwt({ id: user.id, email: user.email })

  const response = NextResponse.json({ success: true })
  response.cookies.set('token', token, {
    httpOnly: true,
    // secure: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1h
    sameSite: 'strict',
  })

  return response
}
