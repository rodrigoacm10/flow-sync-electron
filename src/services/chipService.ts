import prisma from '@/lib/prisma'

// model Chip {
//   id         String      @id @default(uuid())
//   value      Int
//   date       DateTime
//   saved      Boolean
//   synced     Boolean      @default(false)
//   userId     String
//   clientId   String

//   user        User         @relation(fields: [userId], references: [id])
//   clientChips ClientChip[]
// }
export const dynamic = 'force-dynamic'

interface CreateChip {
  value: number
  date: string
  saved: boolean
  synced: boolean
  userId: string
  clientId: string
}

interface ListChip {
  userId: string
}

export class ChipService {
  constructor(private readonly prismaClient = prisma) {}

  async create(data: CreateChip) {
    if (!data.clientId) throw new Error('Client didnt exist')
    const clientExist = await this.prismaClient.client.findUnique({
      where: { id: data.clientId },
    })
    if (!clientExist) throw new Error('Client didnt exist')

    return await this.prismaClient.chip.create({ data })
  }

  async list(data: ListChip) {
    return await this.prismaClient.chip.findMany({
      where: { userId: data.userId },
      include: {
        client: true,
      },
    })
  }

  async delete(chipId: string) {
    return await this.prismaClient.chip.delete({ where: { id: chipId } })
  }
}
