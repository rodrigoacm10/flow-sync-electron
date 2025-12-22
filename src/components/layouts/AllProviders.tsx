'use client'

import { OrdersProvider } from '@/hooks/useOrders'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '../ui/sonner'

export const AllProviders = ({ children }: React.ComponentProps<'div'>) => {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersProvider>
        {children}
        <Toaster />
      </OrdersProvider>
    </QueryClientProvider>
  )
}
