import { z } from 'zod'

export const OrderProductSchema = z.object({
  productName: z.string().min(1),
  productId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  saved: z.boolean(),
  synced: z.boolean(),
})

export const CreateOrderSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

    clientType: z.enum(['registred', 'notRegistred']),
    clientId: z.string().uuid().nullable().optional(),
    clientName: z.string().optional(),

    // tipo do “produto atual” (o que está na UI antes de adicionar)
    productType: z.enum(['registred', 'notRegistred']),
    currentProductId: z.string().uuid().nullable().optional(),
    currentProductName: z.string().optional(),
    currentProductPrice: z.coerce.number().optional(),
    currentProductQuantity: z.coerce.number().int().positive(),

    // lista final
    orderProducts: z
      .array(OrderProductSchema)
      .min(1, 'Adicione pelo menos um produto'),
  })
  .superRefine((v, ctx) => {
    if (v.clientType === 'registred') {
      if (!v.clientId) {
        ctx.addIssue({
          code: 'custom',
          path: ['clientId'],
          message: 'Selecione um cliente registrado.',
        })
      }
    } else {
      if (!v.clientName || !v.clientName.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['clientName'],
          message: 'Informe o nome do cliente.',
        })
      }
    }
  })
