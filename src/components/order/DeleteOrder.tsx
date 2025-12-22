'use client'

import React from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/hooks/useOrders'

export const DeleteOrder = ({
  children,
  orderId,
}: { orderId: string } & React.ComponentProps<'div'>) => {
  const queryClient = useQueryClient()

  const { changeStatus } = useOrders()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/order/${id}`)
      return res.data
    },
    onSuccess: async () => {
      toast.success('Pedido deletado com sucesso!')
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      changeStatus()
    },
    onError: (err) => {
      console.log('Error on delete', err)
      toast.error('Erro ao deletar pedido')
    },
  })

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Excluir Pedido</DialogTitle>
        <DialogDescription>Isso vai deletar o pedido atual</DialogDescription>

        <p>
          Essa ação não poderá ser desfeita. Tem certeza que deseja excluir o
          pedido?
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>

          <Button
            onClick={() => deleteMutation.mutate(orderId)}
            variant="destructive"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
