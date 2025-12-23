'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'

import { CreateClient } from '@/components/CreateClient'
import { CreateGroup } from '@/components/CreateGroup'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { MoreHorizontal } from 'lucide-react'
import { OrderProduct } from '@prisma/client'
import { getDownloadCsv } from '@/utils/getDownloadCsv'
import { DeleteClient } from '@/components/client/DeleteClient'
import { useOrders } from '@/hooks/useOrders'
import { formatBRLFromCents } from '@/utils/moneyBRL'

type Chip = {
  id: string
  value: number // cents
  date: string
  saved: boolean
  synced: boolean
  userId: string
  clientId: string
}

type Order = {
  id: string
  date: string
  clientId: string
  clientName: string
  saved: boolean
  synced: boolean
  userId: string
  concluded: boolean
  orderProducts: OrderProduct[]
}

type Group = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
}

type Client = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
  groupId: string | null
  chips: Chip[]
  orders: Order[]
  group: Group | null
}

type ClientsResponse = {
  data: Client[]
}

function sumChipsValue(chips: Chip[]) {
  return chips.reduce((acc, c) => acc + (Number(c.value) || 0), 0) // cents
}

function sumOrdersValues(orders: Order[]) {
  return orders.reduce(
    (acc, order) =>
      acc +
      order.orderProducts.reduce(
        (acc2, orderProduct) => acc2 + (orderProduct.price || 0), // cents
        0,
      ),
    0,
  )
}

function formatDateBR(dateISO: string) {
  const d = new Date(dateISO)
  if (Number.isNaN(d.getTime())) return dateISO
  return d.toLocaleString('pt-BR')
}

// CSV seguro: "10,00"
function centsToPtBrDecimal(cents: number) {
  const safe = Number.isFinite(Number(cents)) ? Number(cents) : 0
  return (safe / 100).toFixed(2).replace('.', ',')
}

export default function Clients() {
  const { changedStatus } = useOrders()

  const { data, isLoading, isError } = useQuery<ClientsResponse>({
    queryKey: ['clients', changedStatus],
    queryFn: async () => {
      const { data } = await api.get('/client')
      return data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const clients = data?.data ?? []

  // ------- modais (chips / orders)
  const [chipsModalOpen, setChipsModalOpen] = React.useState(false)
  const [ordersModalOpen, setOrdersModalOpen] = React.useState(false)

  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null,
  )
  const openChipsModal = (client: Client) => {
    setSelectedClient(client)
    setChipsModalOpen(true)
  }
  const openOrdersModal = (client: Client) => {
    setSelectedClient(client)
    setOrdersModalOpen(true)
  }
  const closeChipsModal = () => {
    setChipsModalOpen(false)
    setSelectedClient(null)
  }
  const closeOrdersModal = () => {
    setOrdersModalOpen(false)
    setSelectedClient(null)
  }

  // ------- table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = React.useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        id: 'totalValue',
        header: 'Valor',
        cell: ({ row }) => {
          const totalChips = sumChipsValue(row.original.chips || [])
          const totalOrders = sumOrdersValues(row.original.orders || [])
          const saldo = totalChips - totalOrders
          return <div>{formatBRLFromCents(saldo)}</div>
        },
        sortingFn: (a, b) => {
          const asaldo =
            sumChipsValue(a.original.chips || []) -
            sumOrdersValues(a.original.orders || [])
          const bsaldo =
            sumChipsValue(b.original.chips || []) -
            sumOrdersValues(b.original.orders || [])
          return asaldo - bsaldo
        },
      },
      {
        id: 'group',
        header: 'Grupo',
        cell: ({ row }) => (
          <div className="opacity-90">{row.original.group?.name ?? '—'}</div>
        ),
      },
      {
        id: 'ordersCount',
        header: 'Pedidos',
        cell: ({ row }) => {
          const count = row.original.orders?.length ?? 0
          return (
            <button
              type="button"
              onClick={() => openOrdersModal(row.original)}
              className="underline underline-offset-4 hover:opacity-80"
              title="Ver pedidos"
            >
              {count}
            </button>
          )
        },
        sortingFn: (a, b) =>
          (a.original.orders?.length ?? 0) - (b.original.orders?.length ?? 0),
      },
      {
        id: 'chipsCount',
        header: 'Fichas',
        cell: ({ row }) => {
          const count = row.original.chips?.length ?? 0
          return (
            <button
              type="button"
              onClick={() => openChipsModal(row.original)}
              className="underline underline-offset-4 hover:opacity-80"
              title="Ver fichas"
            >
              {count}
            </button>
          )
        },
        sortingFn: (a, b) =>
          (a.original.chips?.length ?? 0) - (b.original.chips?.length ?? 0),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DeleteClient clientId={client.id}>
                    {({ open }) => (
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onSelect={(e) => {
                          e.preventDefault()
                          open()
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DeleteClient>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const v = String(filterValue ?? '').toLowerCase()
      const name = row.original.name?.toLowerCase() ?? ''
      const group = row.original.group?.name?.toLowerCase() ?? ''
      return name.includes(v) || group.includes(v)
    },
  })

  const handleExportCsv = () => {
    const rows = table.getRowModel().rows

    const csvRows = rows.map((row) => {
      const c = row.original

      const totalChips = sumChipsValue(c.chips || [])
      const totalOrders = sumOrdersValues(c.orders || [])
      const saldo = totalChips - totalOrders

      return {
        nome: c.name,
        // ✅ CSV seguro (uma coluna, "10,00")
        saldo: centsToPtBrDecimal(saldo),
        grupo: c.group?.name ?? '',
        pedidos: c.orders?.length ?? 0,
        fichas: c.chips?.length ?? 0,
      }
    })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')

    getDownloadCsv(`clientes_${y}-${m}-${d}.csv`, csvRows)
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen text-white px-6 py-4 flex flex-col">
      <Link href="/dashboard" className="w-fit hover:underline">
        Voltar
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4">
        <h1 className="font-bold text-2xl">Clientes</h1>

        <div className="flex gap-2">
          <CreateGroup>
            <Button variant={'secondary'} className="cursor-pointer">
              + GRUPO
            </Button>
          </CreateGroup>

          <CreateClient>
            <Button variant={'secondary'} className="cursor-pointer">
              + CLIENTE
            </Button>
          </CreateClient>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Input
          className="max-w-sm bg-white/10 border-white/10 text-white placeholder:text-white/50"
          placeholder="Buscar por nome ou grupo..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={
            isLoading || isError || table.getRowModel().rows.length === 0
          }
        >
          Exportar CSV
        </Button>
      </div>

      <div className="mt-4 flex-1 rounded-lg border border-white/10 bg-black/20 overflow-hidden">
        {isLoading && (
          <div className="p-4 text-white/80">Carregando clientes...</div>
        )}

        {isError && (
          <div className="p-4 text-red-400">Erro ao carregar clientes.</div>
        )}

        {!isLoading && !isError && (
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-white/10">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-white/80"
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          cursor: header.column.getCanSort()
                            ? 'pointer'
                            : 'default',
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === 'asc' ? ' ↑' : null}
                        {header.column.getIsSorted() === 'desc' ? ' ↓' : null}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-white/70"
                    >
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-white/10">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-white">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* MODAL: CHIPS */}
      <Dialog
        open={chipsModalOpen}
        onOpenChange={(open) => (open ? null : closeChipsModal())}
      >
        <DialogContent className="bg-zinc-950 text-white border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fichas</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedClient ? `Cliente: ${selectedClient.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Valor</TableHead>
                  <TableHead className="text-white/80">Data</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(selectedClient?.chips ?? []).length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={4}
                      className="h-16 text-center text-white/70"
                    >
                      Sem fichas.
                    </TableCell>
                  </TableRow>
                ) : (
                  (selectedClient?.chips ?? []).map((chip) => (
                    <TableRow key={chip.id} className="border-white/10">
                      <TableCell className="text-white">
                        {formatBRLFromCents(Number(chip.value) || 0)}
                      </TableCell>
                      <TableCell className="text-white">
                        {formatDateBR(chip.date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ORDERS */}
      <Dialog
        open={ordersModalOpen}
        onOpenChange={(open) => (open ? null : closeOrdersModal())}
      >
        <DialogContent className="bg-zinc-950 text-white border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedidos</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedClient ? `Cliente: ${selectedClient.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Valor</TableHead>
                  <TableHead className="text-white/80">Concluído</TableHead>
                  <TableHead className="text-white/80">Data</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(selectedClient?.orders ?? []).length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={4}
                      className="h-16 text-center text-white/70"
                    >
                      Sem pedidos.
                    </TableCell>
                  </TableRow>
                ) : (
                  (selectedClient?.orders ?? []).map((order) => {
                    const total = order.orderProducts.reduce(
                      (acc, op) => acc + (op.price || 0),
                      0,
                    )
                    return (
                      <TableRow key={order.id} className="border-white/10">
                        <TableCell className="text-white">
                          {formatBRLFromCents(total)}
                        </TableCell>
                        <TableCell className="text-white">
                          {order.concluded ? 'sim' : 'não'}
                        </TableCell>
                        <TableCell className="text-white">
                          {formatDateBR(order.date)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
