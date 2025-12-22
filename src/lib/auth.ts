import { NextRequest } from 'next/server'
import { verifyJwt } from './jwt'

export async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  const token = req.cookies.get('token')?.value
  if (!token) {
    throw new Error('Token not found')
  }

  const payload = await verifyJwt(token)
  if (!payload || !payload.id) {
    throw new Error('Invalid token')
  }

  return payload.id as string
}
