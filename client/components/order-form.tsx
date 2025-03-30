"use client"

import { useState, useContext } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { OrderContext } from "@/context/order-context"
import { toast } from "@/components/ui/use-toast"
import { submitOrder } from "@/lib/api"
import { fetchOrderBook, fetchTradeHistory } from "@/lib/api"
import { orderFormValues, orderFormSchema } from "@/schema/orderSchema"
import { OrderOptions } from "@/types/orderTypes"
import { formatErrorResponse } from "@/lib/auth"

interface OrderFormProps {
  onOrderPlaced: () => void
}

export default function OrderForm({ onOrderPlaced }: OrderFormProps) {
  const { refreshOrderBook, refreshTradeHistory } = useContext(OrderContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<orderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderType: OrderOptions.BID,
      price: 2500,
      quantity: 10,
    },
  });

  const onSubmit = async (data: orderFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await submitOrder({
        type: data.orderType,
        price: data.price,
        quantity: data.quantity,
        token: "RELIANCE",
      });

      if(!response.success) {
        throw new Error(response.message);
      }

      const [ isOrderBookRefreshed, isTradeHistoryRefreshed ]  = 
      await Promise.all([refreshOrderBook(), refreshTradeHistory()]);

      if(!isOrderBookRefreshed || !isTradeHistoryRefreshed) {
        toast({
          title: "Error",
          description: "Order created but failed to refresh order book or trade history",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `${data.orderType === "bid" ? "Buy" : "Sell"} ${data.quantity} RELIANCE at ₹${data.price.toLocaleString()}`,
        })
      }

      form.reset({
        orderType: data.orderType,
        price: 2500,
        quantity: 10,
      });

      onOrderPlaced();
    } catch (error: any) {
      console.log("Error submitting order:", error)
      toast({
        title: "Error placing order",
        description: "Please try again later, " + error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Place New Order</CardTitle>
        <CardDescription>Enter the details for your RELIANCE order</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Order Type</Label>
            <RadioGroup
              defaultValue={form.getValues().orderType}
              onValueChange={(value) => form.setValue("orderType", value as OrderOptions)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OrderOptions.BID} id="bid" />
                <Label htmlFor="bid" className="text-green-600">
                  Buy (Bid)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={OrderOptions.ASK} id="ask" />
                <Label htmlFor="ask" className="text-red-600">
                  Sell (Ask)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" type="number" step="0.01" min="0" placeholder="Enter price" {...form.register("price")} />
            {form.formState.errors.price && (
              <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              {...form.register("quantity")}
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Token</Label>
            <Input value="RELIANCE" disabled />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

