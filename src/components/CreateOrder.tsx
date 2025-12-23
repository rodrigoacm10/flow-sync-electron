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
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { CreateOrderSchema } from '@/schemas/orderSchema'
import { getUniqueProduct } from '@/utils/getUniqueProduct'
import { getTodayDate } from '@/utils/getTodayDate'
import { getDateToISO } from '@/utils/getDateToISO'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useOrders } from '@/hooks/useOrders'
import { formatBRLFromCents, parseBRLToCents } from '@/utils/moneyBRL'

// ✅ Tipos mínimos (ajuste se seu backend retornar diferente)
type Client = {
  id: string
  name: string
  chips: Array<{ chip: { value: number } }> // cents
}

type Product = {
  id: string
  name: string
  value: number // cents
  useQuantity?: boolean
  quantity?: number
}

export function CreateOrder({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()
  const { changeStatus } = useOrders()

  const userTimeZone = 'America/Recife'

  const DEFAULTS = {
    date: getTodayDate(userTimeZone),

    clientType: 'registred' as const,
    clientId: null as string | null,
    clientName: '',

    productType: 'registred' as const,
    currentProductId: null as string | null,
    currentProductName: '',
    currentProductPrice: 100, // cents (R$ 1,00) p/ avulso
    currentProductQuantity: 1,

    orderProducts: [] as any[],
  }

  const [open, setOpen] = useState(false)

  // ✅ buscar clients / products (refaz quando abrir)
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    enabled: open,
    queryFn: async () => {
      const { data } = await api.get<{ data: Client[] }>('/client')
      return data.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    enabled: open,
    queryFn: async () => {
      const { data } = await api.get<{ data: Product[] }>('/product')
      return data.data
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const clients = clientsQuery.data ?? []
  const products = productsQuery.data ?? []
  const isLoadingData = clientsQuery.isLoading || productsQuery.isLoading

  const form = useForm<z.input<typeof CreateOrderSchema>>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: DEFAULTS,
    mode: 'onSubmit',
  })

  const {
    control,
    register,
    setValue,
    getValues,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
    reset,
  } = form

  const { fields, append, replace } = useFieldArray({
    control,
    name: 'orderProducts',
  })

  // ✅ toda vez que abrir: refetch de tudo que você quiser
  useEffect(() => {
    if (!open) return

    clientsQuery.refetch()
    productsQuery.refetch()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ quando fechar: limpa tudo
  useEffect(() => {
    if (open) return
    replace([])
    reset(DEFAULTS)
  }, [open, replace, reset])

  const createOrder = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/order', payload)
    },
    onSuccess: async () => {
      toast.success('Pedido criado com sucesso!')
      queryClient.refetchQueries({ queryKey: ['orders'] })

      // ✅ limpa + fecha
      replace([])
      reset(DEFAULTS)
      setOpen(false)

      changeStatus()
    },
    onError: (err) => {
      console.log('Error on create', err)
      toast.error('Erro ao criar pedido')
    },
  })

  const clientType = watch('clientType')
  const clientId = watch('clientId')
  const productType = watch('productType')
  const currentQty = watch('currentProductQuantity')
  const currentProductId = watch('currentProductId')

  const clientDetails = useMemo(() => {
    if (clientType !== 'registred') return null
    if (!clientId) return null
    return clients.find((c) => c.id === clientId) ?? null
  }, [clientId, clientType, clients])

  const clientValue = useMemo(() => {
    if (!clientDetails) return null
    // cents
    return (clientDetails.chips ?? []).reduce(
      (acc: number, v: any) => acc + (v?.chip?.value ?? 0),
      0,
    )
  }, [clientDetails])

  const registredProductDetails = useMemo(() => {
    if (productType !== 'registred') return null
    if (!currentProductId) return null
    return products.find((p) => p.id === currentProductId) ?? null
  }, [currentProductId, productType, products])

  const orderProductsUnique = useMemo(
    () => getUniqueProduct({ values: fields }),
    [fields],
  )

  const orderTotal = useMemo(() => {
    // cents
    return orderProductsUnique.reduce((acc, p) => acc + p.price * p.quantity, 0)
  }, [orderProductsUnique])

  const remaining = useMemo(() => {
    if (clientType !== 'registred') return null
    if (clientValue == null) return null
    return clientValue - orderTotal
  }, [clientType, clientValue, orderTotal])

  function handleChangeClientType(next: 'registred' | 'notRegistred') {
    setValue('clientType', next)
    clearErrors(['clientId', 'clientName'])
    setValue('clientId', null)
    setValue('clientName', '')
  }

  function handleChangeProductType(next: 'registred' | 'notRegistred') {
    setValue('productType', next)
    clearErrors([
      'currentProductId',
      'currentProductName',
      'currentProductPrice',
      'currentProductQuantity',
    ])
    setValue('currentProductId', null)
    setValue('currentProductName', '')
    setValue('currentProductPrice', 100) // R$ 1,00
    setValue('currentProductQuantity', 1)
  }

  function handleAddProduct() {
    const attOrdersProducts = () => {
      const newOrderProducts = getUniqueProduct({
        values: getValues('orderProducts'),
      })
      setValue('orderProducts', newOrderProducts)
    }

    clearErrors([
      'currentProductId',
      'currentProductName',
      'currentProductPrice',
      'currentProductQuantity',
    ])

    const qty = Number(watch('currentProductQuantity') ?? 1)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('currentProductQuantity', {
        type: 'manual',
        message: 'Quantidade precisa ser maior que 0.',
      })
      return
    }

    if (productType === 'registred') {
      const pid = watch('currentProductId')
      if (!pid) {
        setError('currentProductId', {
          type: 'manual',
          message: 'Selecione um produto registrado.',
        })
        return
      }

      const prod = products.find((p) => p.id === pid)
      if (!prod) {
        setError('currentProductId', {
          type: 'manual',
          message: 'Produto inválido.',
        })
        return
      }

      append({
        productName: prod.name,
        productId: prod.id,
        quantity: qty,
        price: prod.value, // cents
        saved: true,
        synced: false,
      })

      setValue('currentProductId', null)
      setValue('currentProductQuantity', 1)

      attOrdersProducts()
      return
    }

    // notRegistred
    const name = (watch('currentProductName') ?? '').trim()
    const price = Number(watch('currentProductPrice') ?? 0) // cents

    if (!name) {
      setError('currentProductName', {
        type: 'manual',
        message: 'Informe o nome do produto.',
      })
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('currentProductPrice', {
        type: 'manual',
        message: 'Preço precisa ser maior que 0.',
      })
      return
    }

    append({
      productName: name,
      productId: null,
      quantity: qty,
      price, // cents
      saved: true,
      synced: false,
    })

    setValue('currentProductName', '')
    setValue('currentProductPrice', 100)
    setValue('currentProductQuantity', 1)
    attOrdersProducts()
  }

  const onSubmit = async (data: z.input<typeof CreateOrderSchema>) => {
    const result = CreateOrderSchema.safeParse(data)
    if (!result.success) {
      console.log('ZOD ERROR:', result.error.flatten())
      return
    }

    const parsed = result.data
    const isRegClient = parsed.clientType === 'registred'

    const client = isRegClient
      ? clients.find((c) => c.id === parsed.clientId) ?? null
      : null

    const payload = {
      date: getDateToISO(parsed.date),
      clientId: isRegClient ? parsed.clientId ?? null : null,
      clientName: isRegClient ? client?.name ?? '' : parsed.clientName ?? '',
      orderProducts: parsed.orderProducts.map((p) => ({
        productName: p.productName,
        productId: p.productId ?? null,
        quantity: p.quantity,
        price: p.price, // cents
        saved: true,
        synced: false,
      })),
      saved: true,
      synced: false,
    }

    createOrder.mutate(payload)
  }

  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          id="create-order-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit, onInvalid)(e)
          }}
        >
          <DialogHeader>
            <DialogTitle>Criar Pedido</DialogTitle>
            <DialogDescription>
              Escolha se o cliente é avulso ou registrado
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Input type="date" {...register('date')} />
              {errors.date?.message && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}

              <div className="border">tipo de cliente</div>
              <Controller
                control={control}
                name="clientType"
                render={({ field }) => (
                  <SelectRegistred
                    type={field.value}
                    setType={(v) => handleChangeClientType(v as any)}
                    onChange={() => {}}
                    placeholder="Selecionar tipo de cliente"
                  />
                )}
              />

              {clientType === 'registred' ? (
                <div className="flex flex-col gap-2">
                  <Controller
                    control={control}
                    name="clientId"
                    render={({ field }) => (
                      <Combobox
                        value={field.value ?? ''}
                        setValue={(v) => field.onChange(v || null)}
                        values={clients}
                        placeholder={
                          isLoadingData
                            ? 'Carregando clientes...'
                            : 'Selecionar Cliente'
                        }
                        labelParam="name"
                        valueParam="id"
                      />
                    )}
                  />
                  {errors.clientId?.message && (
                    <p className="text-xs text-red-500">
                      {errors.clientId.message}
                    </p>
                  )}

                  {clientDetails && (
                    <p className="font-bold text-sm">
                      Saldo do cliente:{' '}
                      {formatBRLFromCents(Number(clientValue ?? 0) || 0)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder="Nome do Cliente"
                    {...register('clientName')}
                  />
                  {errors.clientName?.message && (
                    <p className="text-xs text-red-500">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="border">tipo de produto</div>
              <Controller
                control={control}
                name="productType"
                render={({ field }) => (
                  <SelectRegistred
                    type={field.value}
                    setType={(v) => handleChangeProductType(v as any)}
                    onChange={() => {}}
                    placeholder="Selecionar tipo de produto"
                  />
                )}
              />

              {productType === 'registred' ? (
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="currentProductQuantity"
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={`${field.value ?? 1}`}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          field.onChange(Number.isFinite(n) && n > 0 ? n : 1)
                        }}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="currentProductId"
                    render={({ field }) => (
                      <Combobox
                        value={field.value ?? ''}
                        setValue={(v) => field.onChange(v || null)}
                        values={products}
                        placeholder={
                          isLoadingData
                            ? 'Carregando produtos...'
                            : 'Selecionar Produto'
                        }
                        labelParam="name"
                        valueParam="id"
                      />
                    )}
                  />

                  {registredProductDetails && (
                    <div className="border flex items-center justify-center rounded-md px-2 whitespace-nowrap">
                      {formatBRLFromCents(
                        (registredProductDetails.value || 0) *
                          (Number(currentQty) || 1),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="currentProductQuantity"
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={`${field.value ?? 1}`}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          field.onChange(Number.isFinite(n) && n > 0 ? n : 1)
                        }}
                      />
                    )}
                  />

                  <Input
                    placeholder="Nome do Produto"
                    {...register('currentProductName')}
                  />

                  {/* ✅ preço avulso como moeda -> salva cents */}
                  <Controller
                    control={control}
                    name="currentProductPrice"
                    render={({ field }) => (
                      <Input
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={
                          field.value
                            ? formatBRLFromCents(Number(field.value) || 0)
                            : ''
                        }
                        onChange={(e) => {
                          const cents = parseBRLToCents(e.target.value)
                          field.onChange(cents)
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {(errors.currentProductId?.message ||
                errors.currentProductName?.message ||
                errors.currentProductPrice?.message ||
                errors.currentProductQuantity?.message) && (
                <div className="text-xs text-red-500">
                  {errors.currentProductId?.message && (
                    <p>{errors.currentProductId.message}</p>
                  )}
                  {errors.currentProductName?.message && (
                    <p>{errors.currentProductName.message}</p>
                  )}
                  {errors.currentProductPrice?.message && (
                    <p>{errors.currentProductPrice.message}</p>
                  )}
                  {errors.currentProductQuantity?.message && (
                    <p>{errors.currentProductQuantity.message}</p>
                  )}
                </div>
              )}

              <Button type="button" onClick={handleAddProduct}>
                adicionar produto
              </Button>

              <div className="mt-1">
                {orderProductsUnique.length ? (
                  orderProductsUnique.map((p) => (
                    <div className="text-sm" key={p.productName}>
                      {p.quantity}x - {p.productName} -{' '}
                      {formatBRLFromCents(Number(p.price) || 0)}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs">Nenhum produto</p>
                )}

                {errors.orderProducts?.message && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.orderProducts.message}
                  </p>
                )}
              </div>

              <div className="h-[1px] bg-black/80" />

              <div className="flex flex-col text-sm">
                <p className="font-bold">
                  Total: {formatBRLFromCents(Number(orderTotal) || 0)}
                </p>
                {clientType === 'registred' ? (
                  <p className="font-bold">
                    Saldo restante do cliente:{' '}
                    {formatBRLFromCents(Number(remaining ?? 0) || 0)}
                  </p>
                ) : null}
              </div>

              {fields.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => replace([])}
                >
                  limpar produtos
                </Button>
              )}
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant={'secondary'}
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="create-order-form"
            disabled={isLoadingData || createOrder.isPending}
          >
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
