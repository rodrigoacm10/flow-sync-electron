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
import { CreateProduct } from '@/components/CreateProduct'
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
import type { OrderProduct } from '@prisma/client'
import { DeleteProduct } from '@/components/product/DeleteProduct'
import { useOrders } from '@/hooks/useOrders'

type Category = {
  id: string
  name: string
  saved: boolean
  synced: boolean
  userId: string
}

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
  category: Category | null
  orderProducts: OrderProduct[]
}

type ProductsResponse = {
  data: Product[]
}

function formatMoneyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Products() {
  const { changedStatus } = useOrders()

  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ['products', changedStatus],
    queryFn: async () => {
      const { data } = await api.get('/product')
      return data
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })

  const products = data?.data ?? []

  // ------- table states
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')

  const categories = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      if (p.category?.id && p.category?.name)
        map.set(p.category.id, p.category.name)
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const columns = React.useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
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
        id: 'category',
        header: 'Categoria',
        cell: ({ row }) => (
          <div className="opacity-90">{row.original.category?.name ?? '—'}</div>
        ),
        sortingFn: (a, b) => {
          const an = a.original.category?.name ?? ''
          const bn = b.original.category?.name ?? ''
          return an.localeCompare(bn)
        },
      },
      {
        id: 'quantity',
        header: 'Quantidade',
        cell: ({ row }) => {
          const p = row.original
          return <div>{p.useQuantity ? p.quantity ?? 0 : '—'}</div>
        },
        sortingFn: (a, b) => {
          const av = a.original.useQuantity ? a.original.quantity ?? 0 : -1
          const bv = b.original.useQuantity ? b.original.quantity ?? 0 : -1
          return av - bv
        },
      },
      {
        id: 'ordersCount',
        header: 'Pedidos',
        cell: ({ row }) => <div>{row.original.orderProducts?.length ?? 0}</div>,
        sortingFn: (a, b) =>
          (a.original.orderProducts?.length ?? 0) -
          (b.original.orderProducts?.length ?? 0),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const product = row.original
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
                    onClick={() => console.log('edit', product.id)}
                  >
                    Editar nome
                  </DropdownMenuItem> */}
                  <DeleteProduct productId={product.id}>
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
                  </DeleteProduct>
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
    data: products,
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
      const category = row.original.category?.name?.toLowerCase() ?? ''
      return name.includes(v) || category.includes(v)
    },
  })

  // filtro por categoria (aplica por cima do rowModel do tanstack)
  const filteredRows = React.useMemo(() => {
    const rows = table.getRowModel().rows
    if (categoryFilter === 'all') return rows
    return rows.filter((r) => r.original.category?.id === categoryFilter)
  }, [table, categoryFilter, globalFilter, sorting, products])

  const handleExportCsv = () => {
    const csvRows = filteredRows.map((r) => {
      const p = r.original
      return {
        nome: p.name,
        valor: Number(p.value) || 0,
        categoria: p.category?.name ?? '',
        usaQuantidade: p.useQuantity ? 'sim' : 'não',
        quantidade: p.useQuantity ? p.quantity ?? 0 : '',
        pedidos: p.orderProducts?.length ?? 0,
      }
    })

    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')

    getDownloadCsv(`produtos_${y}-${m}-${d}.csv`, csvRows)
  }

  return (
    <div className="bg-gradient-to-br from-[#000000]/100 to-[#2b2b2b] min-h-screen text-white px-6 py-4 flex flex-col">
      <Link href="/dashboard" className="w-fit hover:underline">
        Voltar
      </Link>

      <div className="flex items-center justify-between gap-4 mt-4">
        <h1 className="font-bold text-2xl">Produtos</h1>

        <div className="flex gap-2">
          <CreateCategory>
            <Button variant={'secondary'} className="cursor-pointer">
              + CATEGORIA
            </Button>
          </CreateCategory>

          <CreateProduct>
            <Button variant={'secondary'} className="cursor-pointer">
              + PRODUTO
            </Button>
          </CreateProduct>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-sm bg-white/10 border-white/10 text-white placeholder:text-white/50"
          placeholder="Buscar por nome ou categoria..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[260px] bg-white/10 border-white/10 text-white">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
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
          <div className="p-4 text-white/80">Carregando produtos...</div>
        )}

        {isError && (
          <div className="p-4 text-red-400">Erro ao carregar produtos.</div>
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
                      Nenhum produto encontrado.
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
