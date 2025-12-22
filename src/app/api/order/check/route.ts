import { OrderService } from '@/services/orderService'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { orderId, to } = await req.json()

    const response = await new OrderService().check(orderId, to)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 400 },
    )
  }
}
