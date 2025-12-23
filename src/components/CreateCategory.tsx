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

const CreateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.'),
})

type CreateCategoryForm = z.input<typeof CreateCategorySchema>

export function CreateCategory({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()

  const form = useForm<CreateCategoryForm>({
    resolver: zodResolver(CreateCategorySchema),
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

  const CreateCategory = useMutation({
    mutationFn: async (payload: {
      name: string
      saved: boolean
      synced: boolean
    }) => {
      await api.post('/category', payload)
    },
    onSuccess: async () => {
      toast.success('Categoria criado com sucesso!')

      // ajuste a key conforme seu app (se existir lista de categorias)
      queryClient.refetchQueries({ queryKey: ['groups'] })

      // ✅ limpa tudo
      reset({ name: '' })
    },
    onError: (err) => {
      console.log('Error on create group', err)
      toast.error('Erro ao criar categoria')
    },
  })

  const onSubmit = (raw: CreateCategoryForm) => {
    const parsed = CreateCategorySchema.safeParse(raw)
    if (!parsed.success) {
      console.log('ZOD ERROR:', parsed.error.flatten())
      return
    }

    const payload = {
      name: parsed.data.name.trim(),
      saved: true,
      synced: false,
    }

    CreateCategory.mutate(payload)
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
            <DialogTitle>Criar Categoria</DialogTitle>
            <DialogDescription>
              Informe o nome do categoria para cadastrar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <div className="grid gap-1">
              <Input placeholder="Nome do categoria" {...register('name')} />
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
            disabled={CreateCategory.isPending}
          >
            Criar Categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
