import { Header } from "@/components/header"
import { Orderbook } from "@/components/orderbook"
import { TradeInterface } from "@/components/trade-interface"
import { MarketStatus } from "@/components/market-status"
import { OrderManagement } from "@/components/order-management"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function MobileLeftPanel() {
  return (
    <Tabs defaultValue="orderbook" className="flex h-full flex-col">
      <div className="px-2 pt-2 pb-1">
        <TabsList variant="line" className="gap-3">
          <TabsTrigger
            value="orderbook"
            className={cn(
              "px-1 text-xs",
              "data-active:text-foreground after:bg-yellow-500!"
            )}
          >
            Sổ lệnh
          </TabsTrigger>
          <TabsTrigger
            value="trades"
            className={cn(
              "px-1 text-xs",
              "data-active:text-foreground after:bg-yellow-500!"
            )}
          >
            Bảng GD
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="orderbook" className="flex-1 min-h-0">
        <Orderbook />
      </TabsContent>
      <TabsContent value="trades" className="flex-1 min-h-0">
        <MarketStatus />
      </TabsContent>
    </Tabs>
  )
}

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-1 md:min-h-0 md:p-2">
      <Header />
      <main className="flex min-h-0 flex-2 md:flex-none md:items-start">
        <div className="flex-1 min-w-0 md:hidden">
          <MobileLeftPanel />
        </div>
        <div className="hidden flex-1 min-w-0 md:block">
          <Orderbook />
        </div>
        <div className="flex-1 min-w-0 md:flex-2">
          <TradeInterface />
        </div>
        <div className="hidden min-w-0 md:block md:flex-1">
          <MarketStatus />
        </div>
      </main>
      <div className="flex min-h-0 flex-1 md:flex-none">
        <OrderManagement />
      </div>
      <Footer />
    </div>
  )
}

export default App
