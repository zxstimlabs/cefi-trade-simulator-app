import { AccountPanel } from "@/components/account-panel"
import { Chart } from "@/components/chart"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { OrderForm } from "@/components/order-form"
import { OrderManagement } from "@/components/order-management"
import { Toaster } from "@/components/ui/sonner"
import { useMediaQuery } from "@/hooks/use-media-query"

// Desktop: chart with order history under it; account and order form down the
// right-hand side.
function DesktopMain() {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-4 grid-rows-[minmax(0,1fr)_17rem] gap-2 py-2">
      <div className="col-span-3 col-start-1 row-start-1 min-h-0 border border-muted-foreground/10">
        <Chart />
      </div>
      <div className="col-span-3 col-start-1 row-start-2 min-h-0">
        <OrderManagement />
      </div>
      <aside className="col-start-4 row-span-2 row-start-1 flex min-h-0 flex-col gap-2 overflow-y-auto">
        <AccountPanel />
        <OrderForm />
      </aside>
    </main>
  )
}

// Mobile: the order form first (the chart is in the header's drawer), then the
// account, then orders.
function MobileMain() {
  return (
    <main className="flex flex-1 flex-col gap-2 py-2">
      <OrderForm />
      <AccountPanel />
      <div className="min-h-80">
        <OrderManagement />
      </div>
    </main>
  )
}

export function App() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  return (
    <div className="flex min-h-svh flex-col p-1 md:h-svh md:p-2">
      <Header />
      {isDesktop ? <DesktopMain /> : <MobileMain />}
      <Footer />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
