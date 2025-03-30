"use client"

import { createContext, useState, type ReactNode, useEffect } from "react"
import { fetchOrderBook, fetchTradeHistory } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"
import { OrderContextType, OrderBook, Trade } from "@/types/orderTypes"
import { toast } from "@/components/ui/use-toast"
const initialOrderBook: OrderBook = {
  bids: [],
  asks: [],
}

export const OrderContext = createContext<OrderContextType>({
  orderBook: initialOrderBook,
  trades: [],
  refreshOrderBook: async () => { return true },
  refreshTradeHistory: async () => { return true },
})

interface OrderProviderProps {
  children: ReactNode
}

export function OrderProvider({ children }: OrderProviderProps) {
  const [orderBook, setOrderBook] = useState<OrderBook>(initialOrderBook)
  const [trades, setTrades] = useState<Trade[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const refreshOrderBook = async () => {
    try {
      const orderBookData = await fetchOrderBook();
      if (!orderBookData) {
        throw new Error("Failed to fetch order book");
      }
      setOrderBook(orderBookData);
      return true;
    } catch (error) {
      return false;
    }
  }

  const refreshTradeHistory = async () => {
    try {
      const tradesData = await fetchTradeHistory();
      if (!tradesData) {
        throw new Error("Failed to fetch trade history");
      }
      setTrades(tradesData);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Load initial data on mount
  useEffect(() => {
    if (!isClient) return

    const loadInitialData = async () => {
      try {
        const isAuth = await isAuthenticated();
        if (!isAuth) {
          throw new Error("User not authenticated yet, skipping initial data load")
        }

        const [isOrderBookRefreshed, isTradeHistoryRefreshed] = await Promise.all([refreshOrderBook(), refreshTradeHistory()])
        if(!isOrderBookRefreshed || !isTradeHistoryRefreshed) {
          throw new Error("Failed to load initial data")
        }
      } catch (error: any) {
        console.log("Failed to load initial data:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    }

    loadInitialData()
  }, [isClient])

  return (
    <OrderContext.Provider
      value={{
        orderBook,
        trades,
        refreshOrderBook,
        refreshTradeHistory,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}