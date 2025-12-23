import { getUserIdFromRequest } from '@/lib/auth'
import { CategoryService } from '@/services/categoryService'
import { ProductService } from '@/services/productService'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') ?? undefined

    const response = await new ProductService().list({ userId, categoryId })

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Inter Server Error' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    const body = await req.json()

    console.log('Body -> ', body)

    if (body.categoryId) {
      const category = await new CategoryService().find(body.categoryId)
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 },
        )
      }
    }

    const response = await new ProductService().create({ ...body, userId })

    console.log('REPONSE ', response)

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 },
    )
  }
}
