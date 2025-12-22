import prisma from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

// model Order {
//   id           String         @id @default(uuid())
//   date         DateTime
//   clientId     String?
//   clientName   String
//   saved        Boolean
//   synced       Boolean        @default(false)
//   userId       String
//
//   user          User           @relation(fields: [userId], references: [id])
//   orderProducts OrderProduct[]
// }
//
export const dynamic = 'force-dynamic'

interface CreateOrder {
  userId: string
  date: string
  clientId?: string
  clientName: string
  // tem que ser true
  saved: boolean
  // off vai ser: false, online vai ser: true
  synced: boolean
}

interface ListOrder {
  userId: string
  date?: string
}

export class OrderService {
  constructor(private readonly prismaClient = prisma) {}

  async create(data: CreateOrder) {
    if (data?.clientId) {
      const clientExist = await this.prismaClient.client.findUnique({
        where: { id: data.clientId },
      })
      if (!clientExist) throw new Error('Client didnt exist')
    }

    return await this.prismaClient.order.create({
      data: data,
      include: { orderProducts: true },
    })
  }

  async check(orderId: string, to: boolean) {
    return await this.prismaClient.order.update({
      where: { id: orderId },
      data: { concluded: to },
    })
  }

  async list(data: ListOrder) {
    return await this.prismaClient.order.findMany({
      where: { userId: data.userId, date: data?.date },
      include: { orderProducts: true },
    })
  }

  async delete(orderId: string) {
    return await this.prismaClient.order.delete({ where: { id: orderId } })
  }
}
