import { getUserIdFromRequest } from '@/lib/auth'
import { CategoryService } from '@/services/categoryService'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const response = await new CategoryService().list(userId)

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const body = await req.json()

    const response = await new CategoryService().create({ ...body, userId })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Internal Server Error' },
      { status: 500 },
    )
  }
}
