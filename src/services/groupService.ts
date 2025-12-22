import prisma from '@/lib/prisma'

// model Group {
//   id      String   @id @default(uuid())
//   name    String
//   saved   Boolean
//   synced  Boolean  @default(false)
//   userId  String
//
//   user    User     @relation(fields: [userId], references: [id])
//   clients Client[]
// }
export const dynamic = 'force-dynamic'

interface CreateGroup {
  userId: string
  name: string
  saved: boolean
  synced: boolean
}

interface EditGroup {
  groupId: string
  name: string
}

export class GroupService {
  constructor(private readonly prismaCLient = prisma) {}

  async create(data: CreateGroup) {
    return await this.prismaCLient.group.create({ data })
  }

  async list(userId: string) {
    return await this.prismaCLient.group.findMany({ where: { userId } })
  }

  async edit(data: EditGroup) {
    return await this.prismaCLient.group.update({
      where: { id: data.groupId },
      data: { name: data.name },
    })
  }

  async delete(groupId: string) {
    return await this.prismaCLient.group.delete({ where: { id: groupId } })
  }
}
