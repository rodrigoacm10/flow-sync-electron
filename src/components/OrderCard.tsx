import { type Order, type OrderProduct } from '@prisma/client'
import { Checkbox } from './ui/checkbox'
import { api } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { MoreVertical } from 'lucide-react'
import { OptionsOrder } from './order/OptionsOrder'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatBRLFromCents } from '@/utils/moneyBRL'

const checkOrder = async ({
  orderId,
  to,
}: {
  orderId: string
  to: boolean
}) => {
  const response = await api.post('/order/check', { orderId, to })
  return response
}

export const OrderCard = ({
  order,
}: {
  order: Order & { orderProducts: OrderProduct[] }
}) => {
  const [checked, setChecked] = useState(order.concluded)
  const { changeStatus } = useOrders()

  useEffect(() => {
    setChecked(order.concluded)
  }, [order.concluded])

  const queryClient = useQueryClient()

  const checkOrderMutation = useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: boolean }) => {
      return checkOrder({ orderId, to })
    },
    onSuccess: async () => {
      toast.success('Pedido dado check com sucesso!')

      await queryClient.invalidateQueries({
        queryKey: ['orders'],
        refetchType: 'active',
      })
      changeStatus()
    },
    onError: (err) => {
      console.log('Error on check', err)
      toast.error('Erro ao dar check no pedido')
    },
  })

  const orderTotalCents =
    order?.orderProducts?.reduce(
      (acc, op) => acc + (op.price ?? 0) * (op.quantity ?? 0),
      0,
    ) ?? 0

  return (
    <div className="bg-[#2b2b2b] rounded-xl px-6 py-3">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <p className="font-bold">12:59</p>
          <p className="font-bold">-</p>

          <p className="font-bold">{formatBRLFromCents(orderTotalCents)}</p>
        </div>

        <div className="flex gap-3 items-center">
          <Checkbox
            checked={checked}
            onCheckedChange={() => {
              const next = !checked
              setChecked(next)
              checkOrderMutation.mutate({ orderId: order.id, to: next })
            }}
          />

          <OptionsOrder order={order}>
            <MoreVertical className="h-5 w-5" />
          </OptionsOrder>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <p className="">{order.clientName}</p>
      </div>

      <div className="grid grid-cols-3  mt-1 gap-2">
        {order?.orderProducts?.map((orderProduct) => (
          <OrderProduct key={orderProduct.id} orderProduct={orderProduct} />
        ))}
      </div>
    </div>
  )
}

const OrderProduct = ({ orderProduct }: { orderProduct: OrderProduct }) => {
  const priceCents = Number(orderProduct.price) || 0

  return (
    <div className="text-sm">
      <p>
        {orderProduct.quantity}x {formatBRLFromCents(priceCents)} -{' '}
        {orderProduct.productName}
      </p>
    </div>
  )
}
