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
import { getDownloadCsv } from '@/utils/getDownloadCsv'

type Client = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
  groupId: string | null
}

type Group = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
  clients: Client[]
}

type GroupsResponse = {
  data: Group[]
}

export default function GroupsPage() {
  const { data, isLoading, isError } = useQuery<GroupsResponse>({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get('/group')
      return data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const groups = data?.data ?? []

  // ------- modal clients
  const [clientsModalOpen, setClientsModalOpen] = React.useState(false)
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null)

  const openClientsModal = (g: Group) => {
    setSelectedGroup(g)
    setClientsModalOpen(true)
  }
  const closeClientsModal = () => {
    setClientsModalOpen(false)
    setSelectedGroup(null)
  }

  // ------- table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = React.useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        id: 'clientsCount',
        header: 'Clientes',
        cell: ({ row }) => {
          const count = row.original.clients?.length ?? 0
          return (
            <button
              type="button"
              onClick={() => openClientsModal(row.original)}
              className="underline underline-offset-4 hover:opacity-80"
              title="Ver clientes"
            >
              {count}
            </button>
          )
        },
        sortingFn: (a, b) =>
          (a.original.clients?.length ?? 0) - (b.original.clients?.length ?? 0),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const group = row.original
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
                    onClick={() => console.log('edit', group.id)}
                  >
                    Editar nome
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log('delete', group.id)}
                    className="text-red-500 focus:text-red-500"
                  >
                    Excluir
                  </DropdownMenuItem>
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
    data: groups,
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
      return name.includes(v)
    },
  })

  const handleExportCsv = () => {
    const rows = table.getRowModel().rows

    const csvRows = rows.map((r) => {
      const g = r.original
      return {
        nome: g.name,
        clientes: g.clients?.length ?? 0,
      }
    })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')

    getDownloadCsv(`grupos_${y}-${m}-${d}.csv`, csvRows)
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen text-white px-6 py-4 flex flex-col">
      <Link href="/dashboard" className="w-fit hover:underline">
        Voltar
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4">
        <h1 className="font-bold text-2xl">Grupos</h1>

        <div className="flex gap-2">
          <CreateGroup>
            <Button variant={'secondary'} className="cursor-pointer">
              + GRUPO
            </Button>
          </CreateGroup>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-sm bg-white/10 border-white/10 text-white placeholder:text-white/50"
          placeholder="Buscar por nome..."
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
          <div className="p-4 text-white/80">Carregando grupos...</div>
        )}

        {isError && (
          <div className="p-4 text-red-400">Erro ao carregar grupos.</div>
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
                      Nenhum grupo encontrado.
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

      {/* MODAL: CLIENTS */}
      <Dialog
        open={clientsModalOpen}
        onOpenChange={(open) => (open ? null : closeClientsModal())}
      >
        <DialogContent className="bg-zinc-950 text-white border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clientes do grupo</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedGroup ? `Grupo: ${selectedGroup.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Nome</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(selectedGroup?.clients ?? []).length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell className="h-16 text-center text-white/70">
                      Sem clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  (selectedGroup?.clients ?? []).map((c) => (
                    <TableRow key={c.id} className="border-white/10">
                      <TableCell className="text-white">{c.name}</TableCell>
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
    </div>
  )
}
