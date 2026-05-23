import { Header } from "@/components/header"
import { Orderbook } from "@/components/orderbook"
import { TradeInterface } from "@/components/trade-interface"
import { MarketStatus } from "@/components/market-status"
import { OrderManagement } from "@/components/order-management"
import { Footer } from "@/components/footer"

export function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <Orderbook />
        </div>
        <div className="flex-2 min-w-0">
          <TradeInterface />
        </div>
        <div className="flex-1 min-w-0">
          <MarketStatus />
        </div>
      </main>
      <OrderManagement />
      <Footer />
    </div>
  )
}

export default App
