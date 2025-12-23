import { getUserIdFromRequest } from '@/lib/auth'
import { CLientService } from '@/services/clientService'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId') ?? undefined

    const response = await new CLientService().list({ userId, groupId })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 400 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const body = await req.json()

    const response = await new CLientService().create({ ...body, userId })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 400 },
    )
  }
}
