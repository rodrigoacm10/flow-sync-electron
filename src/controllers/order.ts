import { OrderService } from '@/services/orderService'
import { getUserIdFromRequest } from '@/lib/auth'
import {
  CreateOrderProduct,
  OrderProductService,
} from '@/services/orderProductsService'

export async function roderGet({ data, date }: { data: any; date?: string }) {
  try {
    const { userId } = data

    const dateParam = date ?? undefined

    const response = await new OrderService().list({
      userId,
      date: dateParam,
    })

    return { data: response, status: 201 }
  } catch (err: any) {
    console.error(err)
    return {
      error: err.message || 'Internal Server Error',
      status: 401,
    }
  }
}

export async function orderPost({ data }: { data: any }) {
  try {
    const userId = await getUserIdFromRequest(data)

    const { orderProducts, ...body } = data

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

    return {
      data: { ...order, orderProducts: orderProduct },
      status: 201,
    }
  } catch (err: any) {
    console.error(err)
    return {
      error: err.message || 'Internal Server Error',
      status: 400,
    }
  }
}
