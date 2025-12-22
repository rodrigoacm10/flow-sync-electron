export const getUniqueProduct = ({ values }: { values: any[] }) => {
  {
    const map = new Map<
      string,
      {
        productName: string
        productId?: string | null
        quantity: number
        price: number
        saved: boolean
        synced: boolean
      }
    >()
    for (const p of values) {
      const key = p.productName
      const existing = map.get(key)
      if (existing) {
        existing.quantity += p.quantity
      } else {
        map.set(key, {
          productName: p.productName,
          productId: (p as any).productId ?? null,
          quantity: p.quantity,
          price: p.price,
          saved: p.saved,
          synced: p.synced,
        })
      }
    }
    return Array.from(map.values())
  }
}
