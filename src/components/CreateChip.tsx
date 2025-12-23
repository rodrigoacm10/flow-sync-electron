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
import { Combobox } from './Combobox'

import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { getTodayDate } from '@/utils/getTodayDate'
import { getDateToISO } from '@/utils/getDateToISO'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string
  chips?: Array<{ value: number }>
}

// Schema do formulário
const CreateChipSchema = z.object({
  date: z.string().min(1, 'Informe a data.'),
  clientId: z.string().uuid('Selecione um cliente válido.'),
  value: z.coerce.number().int().positive('Valor precisa ser maior que 0.'),
})

type CreateChipForm = z.input<typeof CreateChipSchema>

const DEFAULTS = (tz: string) => ({
  date: getTodayDate(tz),
  clientId: '',
  value: 1000,
})

export function CreateChip({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()
  const userTimeZone = 'America/Recife'
  const [open, setOpen] = useState(false)

  // ✅ busca clientes (refaz toda vez que abrir)
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    enabled: open, // só busca quando dialog estiver aberto
    queryFn: async () => {
      const { data } = await api.get<{ data: Client[] }>('/client')
      return data.data
    },
    staleTime: 0, // sempre stale => sempre refetch
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const clients = clientsQuery.data ?? []
  const isLoadingClients = clientsQuery.isLoading

  const form = useForm<CreateChipForm>({
    resolver: zodResolver(CreateChipSchema),
    defaultValues: DEFAULTS(userTimeZone),
    mode: 'onSubmit',
  })

  const {
    control,
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = form

  // ✅ ao abrir: refetch de “todos os itens” que você quiser
  useEffect(() => {
    if (!open) return

    // força refetch dos dados que esse dialog usa
    clientsQuery.refetch()

    // se quiser garantir que outras telas/listas também atualizem ao abrir:
    queryClient.refetchQueries({ queryKey: ['clients'] })
    queryClient.refetchQueries({ queryKey: ['chips'] })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ ao fechar: limpar tudo
  useEffect(() => {
    if (open) return
    reset(DEFAULTS(userTimeZone))
  }, [open, reset, userTimeZone])

  const clientId = watch('clientId')

  const selectedClient = useMemo(() => {
    if (!clientId) return null
    return clients.find((c) => c.id === clientId) ?? null
  }, [clientId, clients])

  const clientBalance = useMemo(() => {
    if (!selectedClient) return null
    return (selectedClient.chips ?? []).reduce(
      (acc, c: any) => acc + (c?.value ?? 0),
      0,
    )
  }, [selectedClient])

  const createChip = useMutation({
    mutationFn: async (payload: {
      date: string
      value: number
      clientId: string
      saved: boolean
      synced: boolean
    }) => {
      await api.post('/chip', payload)
    },
    onSuccess: async () => {
      toast.success('Chip criado com sucesso!')

      queryClient.refetchQueries({ queryKey: ['clients'] })
      queryClient.refetchQueries({ queryKey: ['chips'] })

      // ✅ limpa e fecha (ao fechar, o effect também garante reset)
      reset(DEFAULTS(userTimeZone))
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on create chip', err)
      toast.error('Erro ao criar chip')
    },
  })

  const onSubmit = (raw: CreateChipForm) => {
    const parsed = CreateChipSchema.safeParse(raw)
    if (!parsed.success) {
      console.log('ZOD ERROR:', parsed.error.flatten())
      return
    }

    const payload = {
      date: getDateToISO(parsed.data.date),
      value: parsed.data.value,
      clientId: parsed.data.clientId,
      saved: true,
      synced: false,
    }

    createChip.mutate(payload)
  }

  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          id="create-chip-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit, onInvalid)(e)
          }}
        >
          <DialogHeader>
            <DialogTitle>Criar Chip</DialogTitle>
            <DialogDescription>
              Selecione um cliente registrado e informe data e valor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            {/* Date */}
            <div className="grid gap-1">
              <Input type="date" {...register('date')} />
              {errors.date?.message && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>

            {/* Client (registered only) */}
            <div className="grid gap-1">
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ''}
                    setValue={(v) => field.onChange(v || '')}
                    values={clients}
                    placeholder={
                      isLoadingClients
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

              {selectedClient && (
                <p className="text-xs font-semibold">
                  Saldo atual: {clientBalance ?? 0}
                </p>
              )}
            </div>

            {/* Value */}
            <div className="grid gap-1">
              <Input
                type="number"
                {...register('value', { valueAsNumber: true })}
              />
              {errors.value?.message && (
                <p className="text-xs text-red-500">{errors.value.message}</p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="create-chip-form"
            disabled={isLoadingClients || createChip.isPending}
            onClick={() => {
              if (!watch('clientId')) setValue('clientId', '')
            }}
          >
            Criar Chip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
