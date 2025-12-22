import prisma from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

// model OrderProduct {
//   id          String   @id @default(uuid())
//   orderId     String
//   productName String
//   productId   String?
//   quantity    Int
//   saved       Boolean
//   synced      Boolean  @default(false)
//
//   product Product? @relation(fields: [productId], references: [id])
//   order   Order   @relation(fields: [orderId], references: [id])
// }
export const dynamic = 'force-dynamic'

export interface CreateOrderProduct {
  orderId: string
  productId?: string
  productName: string
  quantity: number
  price: number
  saved: boolean
  synced: boolean
}

export class OrderProductService {
  constructor(private readonly prismaClient = prisma) {}

  async create(data: CreateOrderProduct[]) {
    return await this.prismaClient.$transaction(async (tx) => {
      const results = []
      for (const obj of data) {
        if (obj.productId) {
          const product = await tx.product.findUnique({
            where: { id: obj.productId },
          })
          if (!product) throw new Error(`Product ${obj.productId} not found`)
        }

        const created = await tx.orderProduct.create({ data: obj })
        results.push(created)
      }
      return results
    })
  }
}
