import { OrderService } from '@/services/orderService'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const resposne = await new OrderService().delete(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 400 },
    )
  }
}
