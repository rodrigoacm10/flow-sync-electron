'use client'

import { CreateCategory } from '@/components/CreateCategory'
import { CreateChip } from '@/components/CreateChip'
import { CreateClient } from '@/components/CreateClient'
import { CreateGroup } from '@/components/CreateGroup'
import { CreateOrder } from '@/components/CreateOrder'
import { CreateProduct } from '@/components/CreateProduct'
import { OrderCard } from '@/components/OrderCard'
import { Button } from '@/components/ui/button'
import { useOrders } from '@/hooks/useOrders'
import { Order, OrderProduct } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useMemo } from 'react'
import { formatBRLFromCents } from '@/utils/moneyBRL'

const getProducts = (
  orders: (Order & { orderProducts: OrderProduct[] })[],
): { name: string; quantity: number; price: number }[] => {
  const orderProducts = orders.flatMap((order) => order.orderProducts ?? [])

  const products: { name: string; quantity: number; price: number }[] = []

  for (const op of orderProducts) {
    const idx = products.findIndex((p) => p.name === op.productName)

    if (idx >= 0) products[idx].quantity += op.quantity
    else
      products.push({
        name: op.productName,
        quantity: op.quantity,
        price: op.price, // ✅ price em cents (int)
      })
  }

  return products
}

type OrderWithProducts = Order & { orderProducts: OrderProduct[] }

export default function Dashboard() {
  const { changedStatus } = useOrders()

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery<OrderWithProducts[]>({
    queryKey: ['orders', changedStatus],
    queryFn: async () => {
      const { data } = await axios.get<{ data: OrderWithProducts[] }>(
        '/api/order',
      )
      return data.data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const ordersData = useMemo(() => {
    return {
      all: orders,
      concluded: orders.filter((o) => o.concluded),
      notConcluded: orders.filter((o) => !o.concluded),
    }
  }, [orders])

  const products = useMemo(() => getProducts(orders), [orders])

  const totalCents = useMemo(() => {
    return products.reduce((acc, val) => acc + val.price * val.quantity, 0)
  }, [products])

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] h-screen text-white px-6 py-4 flex flex-col">
      <div className="flex gap-4">
        <Link href="/">Voltar</Link>-
        <Link href="/clients">ir para clientes</Link>-
        <Link href="/products">ir para produtos</Link>-
        <Link href="/chips">ir para fichas</Link>-
        <Link href="/categorys">ir para categorias</Link>-
        <Link href="/groups">ir para grupos</Link>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="font-bold text-2xl">Dashboard</h1>
          {/* <p>select para dia </p> */}
        </div>

        <div className="flex gap-2 text-black bg-">
          <CreateGroup>
            <Button variant={'secondary'} className="cursor-pointer">
              + GRUPO
            </Button>
          </CreateGroup>

          <CreateClient>
            <Button variant={'secondary'} className="cursor-pointer">
              + CLIENTE
            </Button>
          </CreateClient>

          <CreateChip>
            <Button variant={'secondary'} className="cursor-pointer">
              + FICHA
            </Button>
          </CreateChip>

          <CreateCategory>
            <Button variant={'secondary'} className="cursor-pointer">
              + CATEGORIA
            </Button>
          </CreateCategory>

          <CreateProduct>
            <Button variant={'secondary'} className="cursor-pointer">
              + PRODUTO
            </Button>
          </CreateProduct>
        </div>
      </div>

      {isLoading && <p>Carregando...</p>}
      {isError && <p>Erro ao carregar pedidos.</p>}

      <div className="flex flex-1 gap-4">
        <div className="flex-1 relative overflow-y-scroll w-full bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] rounded-xl">
          <div className="absolut w-full flex flex-col gap-1 ">
            {ordersData.notConcluded.length ? (
              ordersData.notConcluded.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="p-8">
                <p className="text-center">Nenhum pedido encontrado</p>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <div className="bg-white h-[1px] w-full"></div>
              <p>realizados</p>
              <div className="bg-white h-[1px] w-full"></div>
            </div>

            {ordersData.concluded.length ? (
              ordersData.concluded.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="p-8">
                <p className="text-center">
                  Nenhum pedido concluído encontrado
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[320px] bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] rounded-xl px-6 py-3 flex flex-col">
          <div className="flex-1">
            <p className="font-bold text-xl mb-3">registros</p>

            <div>
              {products.length ? (
                products.map((value) => (
                  <div key={value.name}>
                    <p>
                      {/* ✅ value.price em cents */}
                      {value.quantity}x {formatBRLFromCents(value.price)} -{' '}
                      {value.name}
                    </p>
                  </div>
                ))
              ) : (
                <p>nenhum produto</p>
              )}
            </div>
          </div>

          <div className="mb-2">
            <p className="font-bold text-xl">
              Total: {formatBRLFromCents(totalCents)}
            </p>
          </div>

          <CreateOrder>
            <Button
              variant={'secondary'}
              size="lg"
              className="font-bold text-lg w-full cursor-pointer"
            >
              + PEDIDO
            </Button>
          </CreateOrder>
        </div>
      </div>
    </div>
  )
}
