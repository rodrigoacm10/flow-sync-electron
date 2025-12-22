import prisma from '@/lib/prisma'

//model Category {
//  id       String    @id @default(uuid())
//  name     String
//  saved    Boolean
//  synced   Boolean   @default(false)
//  userId   String
//
//  user     User      @relation(fields: [userId], references: [id])
//  products Product[]
//}
//
export const dynamic = 'force-dynamic'

interface CreateCategory {
  userId: string
  name: string
  saved: boolean
  synced: boolean
}

interface EditCategory {
  categoryId: string
  name: string
}

export class CategoryService {
  constructor(private readonly prismaCLient = prisma) {}

  async create(data: CreateCategory) {
    return await this.prismaCLient.category.create({
      data,
      include: { products: true },
    })
  }

  async find(categoryId: string) {
    return await this.prismaCLient.category.findUnique({
      where: { id: categoryId },
      include: { products: true },
    })
  }

  async list(userId: string) {
    return await this.prismaCLient.category.findMany({
      where: { userId },
      include: { products: true },
    })
  }

  async edit(data: EditCategory) {
    return await this.prismaCLient.category.update({
      where: { id: data.categoryId },
      data: { name: data.name },
      include: { products: true },
    })
  }

  async delete(categoryId: string) {
    return await this.prismaCLient.category.delete({
      where: { id: categoryId },
    })
  }
}
