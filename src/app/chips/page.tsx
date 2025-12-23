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

import { CreateChip } from '@/components/CreateChip'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { MoreHorizontal } from 'lucide-react'
import { getDownloadCsv } from '@/utils/getDownloadCsv'
import { DeleteChip } from '@/components/chip/DeleteChip'
import { useOrders } from '@/hooks/useOrders'

type Client = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
  groupId: string | null
}

type Chip = {
  id: string
  value: number
  date: string
  saved: boolean
  synced: boolean
  userId: string
  clientId: string
  client: Client
}

type ChipsResponse = {
  data: Chip[]
}

function formatMoneyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateBR(dateISO: string) {
  const d = new Date(dateISO)
  if (Number.isNaN(d.getTime())) return dateISO
  return d.toLocaleString('pt-BR')
}

export default function Chips() {
  const { changedStatus } = useOrders()

  const { data, isLoading, isError } = useQuery<ChipsResponse>({
    queryKey: ['chips', changedStatus],
    queryFn: async () => {
      const { data } = await api.get('/chip')
      return data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const chips = data?.data ?? []

  // ------- table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [clientFilter, setClientFilter] = React.useState<string>('all')

  const clients = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const c of chips) {
      if (c.client?.id && c.client?.name) map.set(c.client.id, c.client.name)
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [chips])

  const columns = React.useMemo<ColumnDef<Chip>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Data',
        cell: ({ row }) => <div>{formatDateBR(row.original.date)}</div>,
        sortingFn: (a, b) =>
          new Date(a.original.date).getTime() -
          new Date(b.original.date).getTime(),
      },
      {
        id: 'clientName',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.client?.name ?? '—'}</div>
        ),
        sortingFn: (a, b) => {
          const an = a.original.client?.name ?? ''
          const bn = b.original.client?.name ?? ''
          return an.localeCompare(bn)
        },
      },
      {
        accessorKey: 'value',
        header: 'Valor',
        cell: ({ row }) => (
          <div>{formatMoneyBRL(Number(row.original.value) || 0)}</div>
        ),
        sortingFn: (a, b) =>
          (Number(a.original.value) || 0) - (Number(b.original.value) || 0),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const chip = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => console.log('edit', chip.id)}
                  >
                    Editar
                  </DropdownMenuItem>
                  <DeleteChip chipId={chip.id}>
                    {({ open }) => (
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onSelect={(e) => {
                          e.preventDefault() // <- impede o dropdown de fechar
                          open() // <- abre o dialog
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DeleteChip>
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
    data: chips,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const v = String(filterValue ?? '').toLowerCase()
      const clientName = row.original.client?.name?.toLowerCase() ?? ''
      return clientName.includes(v)
    },
  })

  // filtro por cliente (aplica por cima do rowModel do tanstack)
  const filteredRows = React.useMemo(() => {
    const rows = table.getRowModel().rows
    if (clientFilter === 'all') return rows
    return rows.filter((r) => r.original.clientId === clientFilter)
  }, [table, clientFilter, globalFilter, sorting, chips])

  const handleExportCsv = () => {
    const csvRows = filteredRows.map((r) => {
      const c = r.original
      return {
        data: c.date, // iso no csv (excel lida melhor). se quiser pt-br, troca por formatDateBR(c.date)
        cliente: c.client?.name ?? '',
        valor: Number(c.value) || 0,
      }
    })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')

    getDownloadCsv(`fichas_${y}-${m}-${d}.csv`, csvRows)
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen text-white px-6 py-4 flex flex-col">
      <Link href="/dashboard" className="w-fit hover:underline">
        Voltar
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4">
        <h1 className="font-bold text-2xl">Fichas</h1>

        <div className="flex gap-2">
          <CreateChip>
            <Button variant={'secondary'} className="cursor-pointer">
              + FICHA
            </Button>
          </CreateChip>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-sm bg-white/10 border-white/10 text-white placeholder:text-white/50"
          placeholder="Buscar por cliente..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[260px] bg-white/10 border-white/10 text-white">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={isLoading || isError || filteredRows.length === 0}
        >
          Exportar CSV
        </Button>
      </div>

      <div className="mt-4 flex-1 rounded-lg border border-white/10 bg-black/20 overflow-hidden">
        {isLoading && (
          <div className="p-4 text-white/80">Carregando fichas...</div>
        )}
        {isError && (
          <div className="p-4 text-red-400">Erro ao carregar fichas.</div>
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
                {filteredRows.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-white/70"
                    >
                      Nenhuma ficha encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
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
    </div>
  )
}
