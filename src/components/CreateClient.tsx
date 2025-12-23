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

type Group = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
}

const DEFAULTS = {
  name: '',
  groupType: 'noGroup' as const,
  groupId: null as string | null,
}

const CreateClientSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome do cliente.'),
    groupType: z.enum(['withGroup', 'noGroup']),
    groupId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.groupType === 'withGroup' && !data.groupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['groupId'],
        message: 'Selecione um grupo.',
      })
    }
  })

type CreateClientForm = z.input<typeof CreateClientSchema>

export function CreateClient({ children }: React.ComponentProps<'div'>) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  // ✅ buscar grupos (sempre refaz quando abrir)
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    enabled: open, // ✅ só faz fetch quando dialog abre
    queryFn: async () => {
      const { data } = await api.get<{ data: Group[] }>('/group')
      return data.data
    },
    staleTime: 0, // ✅ sempre stale -> refetch sem frescura
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const groups = groupsQuery.data ?? []
  const isLoadingGroups = groupsQuery.isLoading

  const form = useForm<CreateClientForm>({
    resolver: zodResolver(CreateClientSchema),
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

  const groupType = watch('groupType')
  const groupId = watch('groupId')

  const selectedGroup = useMemo(() => {
    if (!groupId) return null
    return groups.find((g) => g.id === groupId) ?? null
  }, [groupId, groups])

  // ✅ ao abrir: refetch de "todos os itens" que você quiser
  useEffect(() => {
    if (!open) return

    groupsQuery.refetch()
    queryClient.refetchQueries({ queryKey: ['clients'] })
    // se quiser mais:
    // queryClient.refetchQueries({ queryKey: ['orders'] })
    // queryClient.refetchQueries({ queryKey: ['products'] })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ ao fechar: limpar tudo
  useEffect(() => {
    if (open) return
    reset(DEFAULTS)
  }, [open, reset])

  const createClient = useMutation({
    mutationFn: async (payload: {
      name: string
      saved: boolean
      synced: boolean
      groupId?: string
    }) => {
      await api.post('/client', payload)
    },
    onSuccess: async () => {
      toast.success('Cliente criado com sucesso!')

      queryClient.refetchQueries({ queryKey: ['clients'] })
      queryClient.refetchQueries({ queryKey: ['groups'] })

      // ✅ limpa e fecha
      reset(DEFAULTS)
      setOpen(false)
    },
    onError: (err) => {
      console.log('Error on create client', err)
      toast.error('Erro ao criar cliente')
    },
  })

  function handleChangeGroupType(next: 'withGroup' | 'noGroup') {
    setValue('groupType', next)
    clearErrors(['groupId'])

    if (next === 'noGroup') {
      setValue('groupId', null)
    }
  }

  const onSubmit = (raw: CreateClientForm) => {
    const parsed = CreateClientSchema.safeParse(raw)
    if (!parsed.success) {
      console.log('ZOD ERROR:', parsed.error.flatten())
      return
    }

    const payload: {
      name: string
      saved: boolean
      synced: boolean
      groupId?: string
    } = {
      name: parsed.data.name.trim(),
      saved: true,
      synced: false,
    }

    if (parsed.data.groupType === 'withGroup' && parsed.data.groupId) {
      payload.groupId = parsed.data.groupId
    }

    createClient.mutate(payload)
  }

  const onInvalid = (errs: any) => {
    console.log('FORM INVALID:', errs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          id="create-client-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit, onInvalid)(e)
          }}
        >
          <DialogHeader>
            <DialogTitle>Criar Cliente</DialogTitle>
            <DialogDescription>
              Informe o nome e (opcionalmente) selecione um grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            {/* Nome */}
            <div className="grid gap-1">
              <Input placeholder="Nome do cliente" {...register('name')} />
              {errors.name?.message && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Vai ter grupo? */}
            <div className="grid gap-2">
              <div className="border">grupo</div>

              <Controller
                control={control}
                name="groupType"
                render={({ field }) => (
                  <SelectRegistred
                    type={
                      field.value === 'withGroup' ? 'registred' : 'notRegistred'
                    }
                    setType={(v) =>
                      handleChangeGroupType(
                        v === 'registred' ? 'withGroup' : 'noGroup',
                      )
                    }
                    onChange={() => {}}
                    placeholder="Cliente tem grupo?"
                  />
                )}
              />

              {groupType === 'withGroup' && (
                <div className="grid gap-1">
                  <Controller
                    control={control}
                    name="groupId"
                    render={({ field }) => (
                      <Combobox
                        value={field.value ?? ''}
                        setValue={(v) => field.onChange(v || null)}
                        values={groups}
                        placeholder={
                          isLoadingGroups
                            ? 'Carregando grupos...'
                            : 'Selecionar Grupo'
                        }
                        labelParam="name"
                        valueParam="id"
                      />
                    )}
                  />

                  {errors.groupId?.message && (
                    <p className="text-xs text-red-500">
                      {errors.groupId.message}
                    </p>
                  )}

                  {selectedGroup && (
                    <p className="text-xs font-semibold">
                      Grupo selecionado: {selectedGroup.name}
                    </p>
                  )}
                </div>
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
            form="create-client-form"
            disabled={isLoadingGroups || createClient.isPending}
          >
            Criar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
