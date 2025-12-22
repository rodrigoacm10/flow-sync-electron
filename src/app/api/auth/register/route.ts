import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signJwt } from '@/lib/jwt'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashed, name: 'teste', saved: true },
  })

  const token = await signJwt({ id: user.id, email: user.email })

  const response = NextResponse.json({ success: true })
  response.cookies.set('token', token, {
    httpOnly: true,
    //secure: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
    sameSite: 'strict',
  })

  return response
}
