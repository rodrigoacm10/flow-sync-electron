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

import { useMemo } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { CreateOrderSchema } from '@/schemas/orderSchema'
import { getUniqueProduct } from '@/utils/getUniqueProduct'
import { getTodayDate } from '@/utils/getTodayDate'
import { getDateToISO } from '@/utils/getDateToISO'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useOrders } from '@/hooks/useOrders'

const mockCLient = [
  {
    id: '72d461c8-7fb2-4bc6-856f-eab6950b30ed',
    name: 'cliente-teste',
    saved: true,
    synced: false,
    userId: '56bc99cd-9dbc-4465-9e72-6c72fd7ab780',
    groupId: 'dc3b69e2-b80b-4013-8726-12032c48b96e',
    clientChips: [
      { chip: { value: 1000 } },
      { chip: { value: 1000 } },
      { chip: { value: 1000 } },
    ],
    orders: [],
    group: {
      id: 'dc3b69e2-b80b-4013-8726-12032c48b96e',
      name: 'teste-group',
      saved: true,
      synced: false,
      userId: '56bc99cd-9dbc-4465-9e72-6c72fd7ab780',
    },
  },
]

const mockProduct = [
  {
    id: '71e023a8-0d1d-4ae8-90aa-c34aacdca0dd',
    name: 'test-coxinha',
    value: 990,
    useQuantity: true,
    quantity: 50,
    saved: true,
    synced: false,
    userId: '56bc99cd-9dbc-4465-9e72-6c72fd7ab780',
    categoryId: 'e37a8ac2-84a6-4ad0-96ec-44ef82387a0e',
  },
]

export function CreateOrder({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()

  const { changeStatus } = useOrders()

  const createOrder = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/order', payload)
      // return data.data
    },
    onSuccess: async () => {
      toast.success('Pedido criado com sucesso!')
      //   await queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.refetchQueries({ queryKey: ['orders'] }) // se você quiser forçar na hora
      changeStatus()
    },
    onError: (err) => {
      console.log('Error on delete', err)
      toast.error('Erro ao deletar pedido')
    },
  })

  const userTimeZone = 'America/Recife'
  // ✅ use input type for RHF (what comes from the form)
  type CreateOrderForm = z.input<typeof CreateOrderSchema>

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      date: getTodayDate(userTimeZone),

      clientType: 'registred',
      clientId: null,
      clientName: '',

      productType: 'registred',
      currentProductId: null,
      currentProductName: '',
      currentProductPrice: 1,
      currentProductQuantity: 1,

      orderProducts: [],
    },
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
    formState,
  } = form
  const { errors } = formState

  const { fields, append, replace } = useFieldArray({
    control,
    name: 'orderProducts',
  })

  const clientType = watch('clientType')
  const clientId = watch('clientId')
  const productType = watch('productType')
  const currentQty = watch('currentProductQuantity')
  const currentProductId = watch('currentProductId')

  const clientDetails = useMemo(() => {
    if (clientType !== 'registred') return null
    if (!clientId) return null
    return mockCLient.find((c) => c.id === clientId) ?? null
  }, [clientId, clientType])

  const clientValue = useMemo(() => {
    if (!clientDetails) return null
    return clientDetails.clientChips.reduce(
      (acc: number, v: any) => acc + v.chip.value,
      0,
    )
  }, [clientDetails])

  // “preview” do preço quando produto é registrado
  const registredProductDetails = useMemo(() => {
    if (productType !== 'registred') return null
    if (!currentProductId) return null
    return mockProduct.find((p) => p.id === currentProductId) ?? null
  }, [currentProductId, productType])

  const orderProductsUnique = useMemo(
    () => getUniqueProduct({ values: fields }),
    [fields],
  )

  const orderTotal = useMemo(() => {
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
    setValue('currentProductPrice', 1)
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
      const prod = mockProduct.find((p) => p.id === pid)
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
        price: prod.value,
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
    const price = Number(watch('currentProductPrice') ?? 0)

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
      price,
      saved: true,
      synced: false,
    })

    setValue('currentProductName', '')
    setValue('currentProductPrice', 1)
    setValue('currentProductQuantity', 1)
    attOrdersProducts()
  }

  const onSubmit = async (data: CreateOrderForm) => {
    console.log('SUBMIT RAW:', data)

    const result = CreateOrderSchema.safeParse(data)
    if (!result.success) {
      console.log('ZOD ERROR:', result.error.flatten())
      return
    }

    const parsed = result.data
    console.log('SUBMIT PARSED:', parsed)

    const isRegClient = parsed.clientType === 'registred'
    const client = isRegClient
      ? mockCLient.find((c) => c.id === parsed.clientId) ?? null
      : null

    const payload = {
      date: getDateToISO(parsed.date),
      clientId: isRegClient ? parsed.clientId ?? null : null,
      clientName: isRegClient ? client?.name ?? '' : parsed.clientName ?? '',
      orderProducts: parsed.orderProducts.map((p) => ({
        productName: p.productName,
        productId: p.productId ?? null,
        quantity: p.quantity,
        price: p.price,
        saved: true,
        synced: false,
      })),
      saved: true,
      synced: false,
    }

    // console.log('PAYLOAD:', payload)

    createOrder.mutate(payload)
    // await api.post('/order', payload)
    // changeStatus()
  }

  // não está dando nada no console
  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        {' '}
        <form
          id="create-order-form"
          onSubmit={(e) => {
            // esse console não está acontecendo
            console.log('SUBMIT nativo disparou')
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
              {/* Data */}
              <Input type="date" {...register('date')} />
              {errors.date?.message && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}

              {/* Cliente */}
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
                        values={mockCLient}
                        placeholder="Selecionar Clinete"
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
                      {clientDetails.clientChips.reduce(
                        (acc: number, v: any) => acc + v.chip.value,
                        0,
                      )}
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

              {/* Produto */}
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
                        values={mockProduct}
                        placeholder="Selecionar Produto"
                        labelParam="name"
                        valueParam="id"
                      />
                    )}
                  />

                  {registredProductDetails && (
                    <div className="border flex items-center justify-center rounded-md px-2">
                      {registredProductDetails.value *
                        (Number(currentQty) || 1)}
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
                  <Input type="number" {...register('currentProductPrice')} />
                </div>
              )}

              {/* Erros do “produto atual” */}
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

              {/* Lista */}
              <div className="mt-1">
                {orderProductsUnique.length ? (
                  orderProductsUnique.map((p) => (
                    <div className="text-sm" key={p.productName}>
                      {p.quantity}x - {p.productName} - {p.price}
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

              {/* Totais */}
              <div className="flex flex-col text-sm">
                <p className="font-bold">Total: {orderTotal}</p>

                {clientType === 'registred' ? (
                  <p className="font-bold">
                    Saldo restante do cliente: {remaining ?? 0}
                  </p>
                ) : null}
              </div>

              {/* (Opcional) botão limpar produtos */}
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
            <Button variant={'outline'} type="button">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="create-order-form"
            onClick={() => console.log('CLICK submit nativo')}
          >
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
