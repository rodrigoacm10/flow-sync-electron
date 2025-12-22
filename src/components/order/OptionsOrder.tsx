import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '../ui/button'
import { DeleteIcon, Trash2Icon } from 'lucide-react'
import { DeleteOrder } from './DeleteOrder'
import { Order, OrderProduct } from '@prisma/client'

export function OptionsOrder({
  children,
  order,
}: {
  order: Order & { orderProducts: OrderProduct[] }
} & React.ComponentProps<'div'>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
        {/* <Button variant="outline">Open popover</Button> */}
      </PopoverTrigger>
      <PopoverContent className="w-50 flex flex-col !p-2">
        <DeleteOrder orderId={order.id}>
          <button className="cursor-pointer w-full text-red-400 text-left flex gap-2 items-center">
            <Trash2Icon /> Deletar
          </button>
        </DeleteOrder>

        {/* <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Dimensions</h4>
            <p className="text-muted-foreground text-sm">
              Set the dimensions for the layer.
            </p>
          </div>
        </div> */}
      </PopoverContent>
    </Popover>
  )
}
