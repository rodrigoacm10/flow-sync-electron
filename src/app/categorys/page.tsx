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

import { CreateCategory } from '@/components/CreateCategory'
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
import { DeleteCategory } from '@/components/category/DeleteCategory'
import { useOrders } from '@/hooks/useOrders'

type Product = {
  id: string
  name: string
  value: number
  useQuantity: boolean
  quantity: number
  saved: boolean
  synced: boolean
  userId: string
  categoryId: string | null
  category?: {
    id: string
    name: string
    saved: boolean
    synced: boolean
    userId: string
  } | null
}

type Category = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
  products: Product[]
}

type CategoriesResponse = {
  data: Category[]
}

function formatMoneyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CategoryPage() {
  const { changedStatus } = useOrders()

  const { data, isLoading, isError } = useQuery<CategoriesResponse>({
    queryKey: ['categories', changedStatus],
    queryFn: async () => {
      const { data } = await api.get('/category')
      return data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const categories = data?.data ?? []

  // ------- modal products
  const [productsModalOpen, setProductsModalOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null)

  const openProductsModal = (cat: Category) => {
    setSelectedCategory(cat)
    setProductsModalOpen(true)
  }
  const closeProductsModal = () => {
    setProductsModalOpen(false)
    setSelectedCategory(null)
  }

  // ------- table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = React.useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        id: 'productsCount',
        header: 'Produtos',
        cell: ({ row }) => {
          const count = row.original.products?.length ?? 0
          return (
            <button
              type="button"
              onClick={() => openProductsModal(row.original)}
              className="underline underline-offset-4 hover:opacity-80"
              title="Ver produtos"
            >
              {count}
            </button>
          )
        },
        sortingFn: (a, b) =>
          (a.original.products?.length ?? 0) -
          (b.original.products?.length ?? 0),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const category = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {/* <DropdownMenuItem
                    onClick={() => console.log('edit', category.id)}
                  >
                    Editar nome
                  </DropdownMenuItem> */}
                  <DeleteCategory categoryId={category.id}>
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
                  </DeleteCategory>
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
    data: categories,
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
      const c = r.original
      return {
        nome: c.name,
        produtos: c.products?.length ?? 0,
      }
    })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')

    getDownloadCsv(`categorias_${y}-${m}-${d}.csv`, csvRows)
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen text-white px-6 py-4 flex flex-col">
      <Link href="/dashboard" className="w-fit hover:underline">
        Voltar
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4">
        <h1 className="font-bold text-2xl">Categorias</h1>

        <div className="flex gap-2">
          <CreateCategory>
            <Button variant={'secondary'} className="cursor-pointer">
              + CATEGORIA
            </Button>
          </CreateCategory>
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
          <div className="p-4 text-white/80">Carregando categorias...</div>
        )}

        {isError && (
          <div className="p-4 text-red-400">Erro ao carregar categorias.</div>
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
                      Nenhuma categoria encontrada.
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

      {/* MODAL: PRODUCTS */}
      <Dialog
        open={productsModalOpen}
        onOpenChange={(open) => (open ? null : closeProductsModal())}
      >
        <DialogContent className="bg-zinc-950 text-white border-white/10 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Produtos da categoria</DialogTitle>
            <DialogDescription className="text-white/70">
              {selectedCategory ? `Categoria: ${selectedCategory.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Nome</TableHead>
                  <TableHead className="text-white/80">Valor</TableHead>
                  <TableHead className="text-white/80">Qtd</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(selectedCategory?.products ?? []).length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={3}
                      className="h-16 text-center text-white/70"
                    >
                      Sem produtos.
                    </TableCell>
                  </TableRow>
                ) : (
                  (selectedCategory?.products ?? []).map((p) => (
                    <TableRow key={p.id} className="border-white/10">
                      <TableCell className="text-white">{p.name}</TableCell>
                      <TableCell className="text-white">
                        {formatMoneyBRL(Number(p.value) || 0)}
                      </TableCell>
                      <TableCell className="text-white">
                        {p.useQuantity ? p.quantity ?? 0 : '—'}
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
    </div>
  )
}
