'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

interface OrdersContextProps {
  changedStatus: boolean
  changeStatus: () => void
}

const OrdersContext = createContext<OrdersContextProps | null>(null)

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrdersContext must be used within an OrdersProvider')
  }
  return context
}

type OrdersProviderProps = {
  children: React.ReactNode
}

export function OrdersProvider({ children }: OrdersProviderProps) {
  const [changedStatus, setChangedStatus] = useState(false)

  const changeStatus = () => setChangedStatus((prev) => !prev)

  const value = useMemo(
    () => ({ changedStatus, changeStatus }),
    [changedStatus],
  )

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  )
}
