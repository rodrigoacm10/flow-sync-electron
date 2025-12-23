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

export const DeleteClient = ({
  children,
  clientId,
}: {
  children: (args: { open: () => void }) => React.ReactNode
  clientId: string
}) => {
  const queryClient = useQueryClient()
  const { changeStatus } = useOrders()
  const [open, setOpen] = React.useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/client/${id}`)
      return res.data
    },
    onSuccess: async () => {
      toast.success('Cliente deletado com sucesso!')
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      changeStatus()
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on delete', err)
      toast.error('Erro ao deletar cliente')
    },
  })

  return (
    <>
      {children({ open: () => setOpen(true) })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Excluir Cliente</DialogTitle>
          <DialogDescription>
            Isso vai deletar o Cliente atual
          </DialogDescription>

          <p>
            Essa ação não poderá ser desfeita. Tem certeza que deseja excluir o
            Cliente?
          </p>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={() => deleteMutation.mutate(clientId)}
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
