"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, User } from "lucide-react"
import OrderBook from "@/components/order-book"
import OrderForm from "@/components/order-form"
import TradeHistory from "@/components/trade-history"
import { OrderProvider, OrderContext } from "@/context/order-context"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { useContext } from "react"
import { toast } from "@/components/ui/use-toast"

enum ActiveTabOption {
  DASHBOARD = "dashboard",
  PLACE_ORDER = "place-order",
}

function DashboardContent() {
  const { refreshOrderBook, refreshTradeHistory } = useContext(OrderContext)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<{ name: string } | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTabOption>(ActiveTabOption.DASHBOARD)
  const router = useRouter()

  // useEffect to handle authentication and user data
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isAuthenticated()
      if (!isAuth) {
        router.push("/login")
      } else {
        const user = await getCurrentUser()
        if (user) {
          setUserData({
            name: user.name,
          })
        }
      }
    }

    checkAuth()
  }, [router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        throw new Error("User not authenticated");
      }

      const [ isOrderBookRefreshed, isTradeHistoryRefreshed ]  = 
      await Promise.all([refreshOrderBook(), refreshTradeHistory()])
      
      if(isOrderBookRefreshed && isTradeHistoryRefreshed) {
        toast({
          title: "Success",
          description: "Dashboard refreshed with new data",
        })
      } else {
        throw new Error("Failed to refresh dashboard");
      }   
    } catch (error: any) {
      console.log("Failed to refresh dashboard:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">RELIANCE Order Book</h1>
        <div className="flex flex-wrap items-center gap-4">
          {userData && (
            <Card className="flex items-center gap-2 px-3 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">{userData.name}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span className="font-medium text-green-600">Balance: ∞ units</span>
              </div>
            </Card>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-1">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("access_token")
              localStorage.removeItem("refresh_token")
              router.push("/login")
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTabOption)} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value={ActiveTabOption.DASHBOARD}>Order Book</TabsTrigger>
          <TabsTrigger value={ActiveTabOption.PLACE_ORDER}>Place Order</TabsTrigger>
        </TabsList>

        <TabsContent value={ActiveTabOption.DASHBOARD} className="mt-0">
          <OrderBook />
          <div className="mt-8">
            <TradeHistory />
          </div>
        </TabsContent>

        <TabsContent value={ActiveTabOption.PLACE_ORDER} className="mt-0">
          <OrderForm onOrderPlaced={() => setActiveTab(ActiveTabOption.DASHBOARD)} />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto">
        <OrderProvider>
          <DashboardContent />
        </OrderProvider>
      </div>
    </main>
  )
}

