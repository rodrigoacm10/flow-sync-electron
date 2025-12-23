import prisma from '@/lib/prisma'

// model Product {
//   id            String         @id @default(uuid())
//   name          String
//   value         Int
//   useQuantity   Boolean
//   quantity      Int?
//   saved         Boolean
//   synced        Boolean        @default(false)
//   userId        String
//   categoryId    String
//
//   user          User           @relation(fields: [userId], references: [id])
//   category      Category       @relation(fields: [categoryId], references: [id])
//   orderProducts OrderProduct[]
// }

export const dynamic = 'force-dynamic'

interface CreateProduct {
  name: string
  value: number
  useQuantity: boolean
  quantity?: number
  saved: boolean
  synced: boolean
  userId: string
  categoryId?: string
}

interface ListProduct {
  userId: string
  categoryId?: string
  name?: string
}

export class ProductService {
  constructor(private readonly prismaCLient = prisma) {}

  async create(data: CreateProduct) {
    return await this.prismaCLient.product.create({ data })
  }

  async list(data: ListProduct) {
    return await this.prismaCLient.product.findMany({
      include: { category: true, orderProducts: true },
      where: { userId: data.userId, categoryId: data.categoryId },
    })
  }

  async delete(productId: string) {
    return await this.prismaCLient.product.delete({ where: { id: productId } })
  }
}
