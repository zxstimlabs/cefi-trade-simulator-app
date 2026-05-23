import { Header } from "@/components/header"
import { Orderbook } from "@/components/orderbook"
import { TradeInterface } from "@/components/trade-interface"
import { MarketStatus } from "@/components/market-status"
import { OrderManagement } from "@/components/order-management"
import { Footer } from "@/components/footer"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-1 md:min-h-0 md:p-2">
      <Header />
      <main className="flex min-h-0 flex-2 md:flex-none md:items-start">
        <div className="flex-1 min-w-0">
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
