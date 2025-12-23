'use client'

import * as React from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/hooks/useOrders'

export const DeleteProduct = ({
  children,
  productId,
}: {
  children: (args: { open: () => void }) => React.ReactNode
  productId: string
}) => {
  const queryClient = useQueryClient()
  const { changeStatus } = useOrders()
  const [open, setOpen] = React.useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/product/${id}`)
      return res.data
    },
    onSuccess: async () => {
      toast.success('Produto deletado com sucesso!')
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      changeStatus()
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on delete', err)
      toast.error('Erro ao deletar Produto')
    },
  })

  return (
    <>
      {children({ open: () => setOpen(true) })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Excluir Produto</DialogTitle>
          <DialogDescription>
            Isso vai deletar o Produto atual
          </DialogDescription>

          <p>
            Essa ação não poderá ser desfeita. Tem certeza que deseja excluir o
            Produto?
          </p>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={() => deleteMutation.mutate(productId)}
              variant="destructive"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
