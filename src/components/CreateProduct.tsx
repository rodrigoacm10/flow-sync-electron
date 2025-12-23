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
import { SelectRegistred } from './order/SelectRegistred'
import { Combobox } from './Combobox'

import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
}

const DEFAULTS = {
  name: '',
  value: 1,
  stockType: 'noStock' as const,
  quantity: 0,
  categoryId: null as string | null,
}

const CreateProductSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome do produto.'),
    value: z.coerce.number().int().positive('Valor precisa ser maior que 0.'),

    stockType: z.enum(['withStock', 'noStock']),
    quantity: z.coerce.number().int().nonnegative().optional(),

    categoryId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.stockType === 'withStock') {
      if (
        data.quantity == null ||
        !Number.isFinite(data.quantity) ||
        data.quantity <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantity'],
          message: 'Informe uma quantidade maior que 0.',
        })
      }
    }
  })

type CreateProductForm = z.input<typeof CreateProductSchema>

export function CreateProduct({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  // ✅ buscar categorias (só quando dialog estiver aberto)
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    enabled: open, // ✅ só busca quando abrir
    queryFn: async () => {
      const { data } = await api.get<{ data: Category[] }>('/category')
      return data.data
    },
    staleTime: 0, // ✅ sempre "stale" (facilita refetch)
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const categories = categoriesQuery.data ?? []
  const isLoadingCategories = categoriesQuery.isLoading

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: DEFAULTS,
    mode: 'onSubmit',
  })

  const {
    control,
    register,
    watch,
    setValue,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const stockType = watch('stockType')
  const categoryId = watch('categoryId')

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null
    return categories.find((c) => c.id === categoryId) ?? null
  }, [categoryId, categories])

  function handleChangeStockType(next: 'withStock' | 'noStock') {
    setValue('stockType', next)
    clearErrors(['quantity'])

    if (next === 'noStock') {
      setValue('quantity', 0)
    }
  }

  // ✅ sempre que abrir o dialog: refetch "de todos os itens"
  // aqui: categories + (se quiser) products
  useEffect(() => {
    if (!open) return

    categoriesQuery.refetch()
    queryClient.refetchQueries({ queryKey: ['products'] })
    // adicione outros itens aqui se quiser:
    // queryClient.refetchQueries({ queryKey: ['clients'] })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ sempre que fechar o dialog: limpa tudo
  useEffect(() => {
    if (open) return
    reset(DEFAULTS)
  }, [open, reset])

  const createProduct = useMutation({
    mutationFn: async (payload: {
      name: string
      value: number
      useQuantity: boolean
      quantity: number
      saved: boolean
      synced: boolean
      categoryId?: string
    }) => {
      await api.post('/product', payload)
    },
    onSuccess: async () => {
      toast.success('Produto criado com sucesso!')

      queryClient.refetchQueries({ queryKey: ['products'] })
      queryClient.refetchQueries({ queryKey: ['categories'] })

      // ✅ limpa tudo e fecha
      reset(DEFAULTS)
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on create product', err)
      toast.error('Erro ao criar produto')
    },
  })

  const onSubmit = (raw: CreateProductForm) => {
    const parsed = CreateProductSchema.safeParse(raw)
    if (!parsed.success) {
      console.log('ZOD ERROR:', parsed.error.flatten())
      return
    }

    const useQuantity = parsed.data.stockType === 'withStock'
    const quantity = useQuantity ? Number(parsed.data.quantity ?? 0) : 0

    const payload: any = {
      name: parsed.data.name.trim(),
      value: parsed.data.value,
      useQuantity,
      quantity,
      saved: true,
      synced: false,
    }

    if (parsed.data.categoryId) {
      payload.categoryId = parsed.data.categoryId
    }

    createProduct.mutate(payload)
  }

  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          id="create-product-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit, onInvalid)(e)
          }}
        >
          <DialogHeader>
            <DialogTitle>Criar Produto</DialogTitle>
            <DialogDescription>
              Informe nome, valor, estoque (opcional) e categoria (opcional).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            {/* Nome */}
            <div className="grid gap-1">
              <Input placeholder="Nome do produto" {...register('name')} />
              {errors.name?.message && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Valor */}
            <div className="grid gap-1">
              <Input
                type="number"
                {...register('value', { valueAsNumber: true })}
              />
              {errors.value?.message && (
                <p className="text-xs text-red-500">{errors.value.message}</p>
              )}
            </div>

            {/* Estoque */}
            <div className="grid gap-2">
              <div className="border">controlar quantidade?</div>

              <Controller
                control={control}
                name="stockType"
                render={({ field }) => (
                  <SelectRegistred
                    type={
                      field.value === 'withStock' ? 'registred' : 'notRegistred'
                    }
                    setType={(v) =>
                      handleChangeStockType(
                        v === 'registred' ? 'withStock' : 'noStock',
                      )
                    }
                    onChange={() => {}}
                    placeholder="Controlar estoque?"
                  />
                )}
              />

              {stockType === 'withStock' && (
                <div className="grid gap-1">
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  {errors.quantity?.message && (
                    <p className="text-xs text-red-500">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Categoria (opcional) */}
            <div className="grid gap-2">
              <div className="border">categoria (opcional)</div>

              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ''}
                    setValue={(v) => field.onChange(v || null)}
                    values={categories}
                    placeholder={
                      isLoadingCategories
                        ? 'Carregando categorias...'
                        : 'Selecionar Categoria'
                    }
                    labelParam="name"
                    valueParam="id"
                  />
                )}
              />

              {selectedCategory && (
                <p className="text-xs font-semibold">
                  Categoria selecionada: {selectedCategory.name}
                </p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)} // ✅ dispara limpeza via effect
            >
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="create-product-form"
            disabled={isLoadingCategories || createProduct.isPending}
          >
            Criar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
