'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const CreateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.'),
})

type CreateGroupForm = z.input<typeof CreateGroupSchema>

export function CreateGroup({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onSubmit',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const createGroup = useMutation({
    mutationFn: async (payload: {
      name: string
      saved: boolean
      synced: boolean
    }) => {
      await api.post('/group', payload)
    },
    onSuccess: async () => {
      toast.success('Grupo criado com sucesso!')

      // ajuste a key conforme seu app (se existir lista de grupos)
      queryClient.refetchQueries({ queryKey: ['groups'] })

      // ✅ limpa tudo
      reset({ name: '' })
    },
    onError: (err) => {
      console.log('Error on create group', err)
      toast.error('Erro ao criar grupo')
    },
  })

  const onSubmit = (raw: CreateGroupForm) => {
    const parsed = CreateGroupSchema.safeParse(raw)
    if (!parsed.success) {
      console.log('ZOD ERROR:', parsed.error.flatten())
      return
    }

    const payload = {
      name: parsed.data.name.trim(),
      saved: true,
      synced: false,
    }

    createGroup.mutate(payload)
  }

  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          id="create-group-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit, onInvalid)(e)
          }}
        >
          <DialogHeader>
            <DialogTitle>Criar Grupo</DialogTitle>
            <DialogDescription>
              Informe o nome do grupo para cadastrar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div className="grid gap-1">
              <Input placeholder="Nome do grupo" {...register('name')} />
              {errors.name?.message && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="create-group-form"
            disabled={createGroup.isPending}
          >
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
