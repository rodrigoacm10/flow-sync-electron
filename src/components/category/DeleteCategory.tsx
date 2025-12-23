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

export const DeleteCategory = ({
  children,
  categoryId,
}: {
  children: (args: { open: () => void }) => React.ReactNode
  categoryId: string
}) => {
  const queryClient = useQueryClient()
  const { changeStatus } = useOrders()
  const [open, setOpen] = React.useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/category/${id}`)
      return res.data
    },
    onSuccess: async () => {
      toast.success('Categoria deletado com sucesso!')
      await queryClient.invalidateQueries({ queryKey: ['categorys'] })
      changeStatus()
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on delete', err)
      toast.error('Erro ao deletar Categoria')
    },
  })

  return (
    <>
      {children({ open: () => setOpen(true) })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Excluir Categoria</DialogTitle>
          <DialogDescription>
            Isso vai deletar o Categoria atual
          </DialogDescription>

          <p>
            Essa ação não poderá ser desfeita. Tem certeza que deseja excluir o
            Categoria?
          </p>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={() => deleteMutation.mutate(categoryId)}
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
