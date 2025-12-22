import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/services/orderService'
import { getUserIdFromRequest } from '@/lib/auth'
import {
  CreateOrderProduct,
  OrderProductService,
} from '@/services/orderProductsService'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? undefined

    const response = await new OrderService().list({
      userId,
      date,
    })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 401 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const { orderProducts, ...body } = await req.json()

    const order = await new OrderService().create({
      ...body,
      userId,
      saved: true, // obrigatório ser true
      synced: false, // default off
    })

    const orderProductOrderId = orderProducts.map(
      (obj: CreateOrderProduct) => ({
        ...obj,
        orderId: order.id,
      }),
    )

    const orderProduct = await new OrderProductService().create(
      orderProductOrderId,
    )

    return NextResponse.json(
      { data: { ...order, orderProducts: orderProduct } },
      { status: 201 },
    )
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 400 },
    )
  }
}
