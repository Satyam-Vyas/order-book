import { z } from "zod"

export const orderFormSchema = z.object({
    orderType: z.enum(["bid", "ask"]),
    price: z.coerce.number().positive("Price must be positive"),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  })

export type orderFormValues = z.infer<typeof orderFormSchema>