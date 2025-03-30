"use client"

import type React from "react"
import { useContext, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { OrderContext } from "@/context/order-context"
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Number of trades to display per page
const ITEMS_PER_PAGE = 10

const TIME_FILTERS = [
  { value: "1", label: "Last 1 hour" },
  { value: "3", label: "Last 3 hours" },
  { value: "6", label: "Last 6 hours" },
  { value: "12", label: "Last 12 hours" },
  { value: "24", label: "Last 24 hours" },
  { value: "all", label: "All trades" },
]

export default function TradeHistory() {
  const { trades } = useContext(OrderContext)
  const [currentPage, setCurrentPage] = useState(1)
  const [timeFilter, setTimeFilter] = useState("all")
  const [pageInput, setPageInput] = useState("")

  // Reset page numbers when trades or time filter changes
  useEffect(() => {
    setCurrentPage(1)
    setPageInput("")
  }, [trades, timeFilter])

  const filteredTrades = trades.filter((trade) => {
    if (timeFilter === "all") return true

    const hoursDiff = (Date.now() - trade.timestamp.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= Number.parseInt(timeFilter)
  })
  
  const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE) 
  const currentTrades = filteredTrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setPageInput(value)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNumber = Number.parseInt(pageInput)
      if (pageNumber && pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber)
      } else {
        setPageInput(currentPage.toString())
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade History</h2>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Time filter" />
            </SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-blue-50 py-2">
          <CardTitle className="text-sm font-medium text-blue-700">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b bg-muted/40">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Price (₹)</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Quantity</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {currentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                      No trades executed yet
                    </td>
                  </tr>
                ) : (
                  currentTrades.map((trade) => (
                    <tr key={trade.id} className="border-b">
                      <td className="px-2 py-1.5 text-left text-muted-foreground">{formatDateTime(trade.timestamp)}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-medium ${
                          trade.taker_side === "bid" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(trade.price)}
                      </td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(trade.quantity)}</td>
                      <td className="px-2 py-1.5 text-right">{formatCurrency(trade.price * trade.quantity)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t bg-muted/20 px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Page</span>
                <Input
                  className="h-7 w-12 text-center text-xs"
                  value={pageInput || currentPage}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={() => setPageInput("")}
                />
                <span className="text-xs text-muted-foreground">of {totalPages}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

