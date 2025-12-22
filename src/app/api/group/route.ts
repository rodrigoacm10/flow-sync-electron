import { getUserIdFromRequest } from '@/lib/auth'
import { GroupService } from '@/services/groupService'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const response = await new GroupService().list(userId)

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 201 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const body = await req.json()

    const response = await new GroupService().create({ ...body, userId })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 201 },
    )
  }
}
