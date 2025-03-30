"use client"

import type React from "react"
import { useContext, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { OrderContext } from "@/context/order-context"
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Order } from "@/types/orderTypes"

// Number of orders to display per page
const ITEMS_PER_PAGE = 10

export default function OrderBook() {
  const { orderBook } = useContext(OrderContext)
  const [bidPage, setBidPage] = useState(1)
  const [askPage, setAskPage] = useState(1)
  const [bidPageInput, setBidPageInput] = useState("")
  const [askPageInput, setAskPageInput] = useState("")

  // Reset page numbers when orderBook changes
  useEffect(() => {
    setBidPage(1)
    setAskPage(1)
    setBidPageInput("")
    setAskPageInput("")
  }, [orderBook])

  const totalBidPages = Math.ceil(orderBook.bids.length / ITEMS_PER_PAGE)
  const totalAskPages = Math.ceil(orderBook.asks.length / ITEMS_PER_PAGE)

  const currentBids = orderBook.bids
    .sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice((bidPage - 1) * ITEMS_PER_PAGE, bidPage * ITEMS_PER_PAGE)
  const currentAsks = orderBook.asks
    .sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice((askPage - 1) * ITEMS_PER_PAGE, askPage * ITEMS_PER_PAGE)

  const maxQuantity = Math.max(
    ...currentBids.map((order: Order) => order.quantity),
    ...currentAsks.map((order: Order) => order.quantity),
    1, 
  )

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>, setPageInput: (value: string) => void) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setPageInput(value)
  }

  const handleBidPageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNumber = Number.parseInt(bidPageInput)
      if (pageNumber && pageNumber > 0 && pageNumber <= totalBidPages) {
        setBidPage(pageNumber)
      } else {
        setBidPageInput(bidPage.toString())
      }
    }
  }

  const handleAskPageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNumber = Number.parseInt(askPageInput)
      if (pageNumber && pageNumber > 0 && pageNumber <= totalAskPages) {
        setAskPage(pageNumber)
      } else {
        setAskPageInput(askPage.toString())
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Order Book</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-green-50 py-2">
            <CardTitle className="text-sm font-medium text-green-700">Bids (Buy Orders)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Price (₹)</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Quantity</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Total (₹)</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBids.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                        No bids available
                      </td>
                    </tr>
                  ) : (
                    currentBids.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="relative px-2 py-1.5 font-medium text-green-600">
                          <div
                            className="absolute bottom-0 left-0 top-0 bg-green-100"
                            style={{
                              width: `${(order.quantity / maxQuantity) * 100}%`,
                              zIndex: -1,
                            }}
                          />
                          {formatCurrency(order.price)}
                        </td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(order.quantity)}</td>
                        <td className="px-2 py-1.5 text-right">{formatCurrency(order.price * order.quantity)}</td>
                        <td className="px-2 py-1.5 text-right text-muted-foreground">
                          {formatRelativeTime(new Date(order.timestamp))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalBidPages > 1 && (
                <div className="flex items-center justify-between border-t bg-muted/20 px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBidPage((p) => Math.max(1, p - 1))}
                    disabled={bidPage === 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Page</span>
                    <Input
                      className="h-7 w-12 text-center text-xs"
                      value={bidPageInput || bidPage}
                      onChange={(e) => handlePageInputChange(e, setBidPageInput)}
                      onKeyDown={handleBidPageInputKeyDown}
                      onBlur={() => setBidPageInput("")}
                    />
                    <span className="text-xs text-muted-foreground">of {totalBidPages}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBidPage((p) => Math.min(totalBidPages, p + 1))}
                    disabled={bidPage === totalBidPages}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-red-50 py-2">
            <CardTitle className="text-sm font-medium text-red-700">Asks (Sell Orders)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Price (₹)</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Quantity</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Total (₹)</th>
                    <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAsks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                        No asks available
                      </td>
                    </tr>
                  ) : (
                    currentAsks.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="relative px-2 py-1.5 font-medium text-red-600">
                          <div
                            className="absolute bottom-0 left-0 top-0 bg-red-100"
                            style={{
                              width: `${(order.quantity / maxQuantity) * 100}%`,
                              zIndex: -1,
                            }}
                          />
                          {formatCurrency(order.price)}
                        </td>
                        <td className="px-2 py-1.5 text-right">{formatNumber(order.quantity)}</td>
                        <td className="px-2 py-1.5 text-right">{formatCurrency(order.price * order.quantity)}</td>
                        <td className="px-2 py-1.5 text-right text-muted-foreground">
                          {formatRelativeTime(new Date(order.timestamp))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalAskPages > 1 && (
                <div className="flex items-center justify-between border-t bg-muted/20 px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAskPage((p) => Math.max(1, p - 1))}
                    disabled={askPage === 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Page</span>
                    <Input
                      className="h-7 w-12 text-center text-xs"
                      value={askPageInput || askPage}
                      onChange={(e) => handlePageInputChange(e, setAskPageInput)}
                      onKeyDown={handleAskPageInputKeyDown}
                      onBlur={() => setAskPageInput("")}
                    />
                    <span className="text-xs text-muted-foreground">of {totalAskPages}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAskPage((p) => Math.min(totalAskPages, p + 1))}
                    disabled={askPage === totalAskPages}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

